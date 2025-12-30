import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * POST /api/v2/ai/icebreakers
 * Generate personalized icebreaker lines for leads
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { leadIds, tone } = await req.json()

        if (!leadIds || !Array.isArray(leadIds)) {
            return NextResponse.json({ error: "leadIds array is required" }, { status: 400 })
        }

        // Limit to 20 leads per request
        const limitedIds = leadIds.slice(0, 20)

        const leads = await prisma.lead.findMany({
            where: {
                id: { in: limitedIds },
                campaign: { userId: auth.user.id }
            }
        })

        if (leads.length === 0) {
            return NextResponse.json({ error: "No authorized leads found" }, { status: 404 })
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const results = await Promise.all(
            leads.map(async (lead) => {
                const prompt = `
Generate a short, casual, one-sentence icebreaker line for a cold email.
Lead Name: ${lead.firstName || "there"}
Company: ${lead.company || "your company"}
Tone: ${tone || "casual/friendly"}

Examples:
- "Saw you guys are doing some cool stuff at ${lead.company || "your company"}, had to reaching out."
- "Been following ${lead.company || "your company"} for a bit, love the recent growth."

Respond with ONLY the icebreaker text.
`

                try {
                    const result = await model.generateContent(prompt)
                    const icebreaker = result.response.text().trim()

                    // Update lead custom fields
                    const existingFields = lead.customFields ? JSON.parse(lead.customFields) : {}
                    const updated = { ...existingFields, icebreaker }

                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { customFields: JSON.stringify(updated) }
                    })

                    return { id: lead.id, icebreaker, success: true }
                } catch (e) {
                    return { id: lead.id, success: false }
                }
            })
        )

        return NextResponse.json({
            message: `Generated icebreakers for ${results.filter(r => r.success).length} leads`,
            results
        })
    } catch (error) {
        console.error("API POST /v2/ai/icebreakers error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
