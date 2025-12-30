import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * POST /api/v2/leads/enrich
 * Enrich leads with AI-generated company/industry data
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { leadIds } = await req.json()

        if (!leadIds || !Array.isArray(leadIds)) {
            return NextResponse.json({ error: "leadIds array is required" }, { status: 400 })
        }

        // Limit to 10 leads per request (AI cost control)
        const limitedIds = leadIds.slice(0, 10)

        // Fetch leads with ownership check
        const leads = await prisma.lead.findMany({
            where: {
                id: { in: limitedIds },
                campaign: { userId: auth.user.id }
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                customFields: true
            }
        })

        if (leads.length === 0) {
            return NextResponse.json({ error: "No authorized leads found" }, { status: 404 })
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const enrichedLeads = await Promise.all(
            leads.map(async (lead) => {
                const domain = lead.email.split("@")[1]

                const prompt = `
Based on this email domain and name, provide enrichment data:
Email: ${lead.email}
Domain: ${domain}
Name: ${lead.firstName || ""} ${lead.lastName || ""}
Company: ${lead.company || "Unknown"}

Respond in JSON only:
{
  "companySize": "1-10 | 11-50 | 51-200 | 201-500 | 500+",
  "industry": "Industry name",
  "estimatedRole": "Job title guess",
  "timezone": "Timezone guess",
  "linkedInUrl": "LinkedIn profile URL guess or null"
}
`

                try {
                    const result = await model.generateContent(prompt)
                    const text = result.response.text()
                    const jsonMatch = text.match(/\{[\s\S]*\}/)

                    if (jsonMatch) {
                        const enrichment = JSON.parse(jsonMatch[0])
                        const existingFields = lead.customFields ? JSON.parse(lead.customFields) : {}
                        const merged = { ...existingFields, ...enrichment, enrichedAt: new Date().toISOString() }

                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: { customFields: JSON.stringify(merged) }
                        })

                        return { id: lead.id, email: lead.email, enrichment, success: true }
                    }
                } catch (e) {
                    console.error(`Enrichment failed for ${lead.email}:`, e)
                }

                return { id: lead.id, email: lead.email, success: false }
            })
        )

        const successCount = enrichedLeads.filter(l => l.success).length

        return NextResponse.json({
            message: `Enriched ${successCount} of ${leads.length} leads`,
            results: enrichedLeads
        })
    } catch (error) {
        console.error("API POST /v2/leads/enrich error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
