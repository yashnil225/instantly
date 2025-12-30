import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * POST /api/v2/ai/clone-best
 * Analyze user's best performing campaign and create a similar one
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { name, targetIndustry } = await req.json()

        // Find the best performing campaign (highest reply rate)
        const campaigns = await prisma.campaign.findMany({
            where: {
                userId: auth.user.id,
                sentCount: { gt: 10 } // Only consider campaigns with meaningful data
            },
            include: {
                sequences: {
                    orderBy: { stepNumber: "asc" }
                }
            },
            orderBy: { replyCount: "desc" },
            take: 1
        })

        if (campaigns.length === 0) {
            return NextResponse.json({
                error: "No campaigns with sufficient data found. Send at least 10 emails first."
            }, { status: 400 })
        }

        const bestCampaign = campaigns[0]
        const replyRate = bestCampaign.sentCount > 0
            ? ((bestCampaign.replyCount / bestCampaign.sentCount) * 100).toFixed(1)
            : "0"

        // Use AI to generate a similar but fresh campaign
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
You are an expert cold email copywriter. Analyze this successful campaign and create a similar one for a new target.

BEST PERFORMING CAMPAIGN (${replyRate}% reply rate):
Name: ${bestCampaign.name}
Sequences:
${bestCampaign.sequences.map((s, i) => `
Step ${i + 1}:
Subject: ${s.subject}
Body: ${s.body}
Day Gap: ${s.dayGap}
`).join("\n")}

TARGET: ${targetIndustry || "Same industry"}

Create a new email sequence that maintains the winning elements (tone, structure, CTAs) but with fresh copy.
Respond in this exact JSON format:
{
  "sequences": [
    { "subject": "...", "body": "...", "dayGap": 1 },
    { "subject": "...", "body": "...", "dayGap": 3 }
  ]
}
`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Parse the JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("Failed to parse AI response")
        }

        const aiData = JSON.parse(jsonMatch[0])

        // Create the new campaign
        const newCampaign = await prisma.campaign.create({
            data: {
                name: name || `Clone of ${bestCampaign.name}`,
                userId: auth.user.id,
                status: "draft",
                sequences: {
                    create: aiData.sequences.map((seq: any, index: number) => ({
                        stepNumber: index + 1,
                        subject: seq.subject,
                        body: seq.body,
                        dayGap: seq.dayGap || 1
                    }))
                }
            },
            include: { sequences: true }
        })

        return NextResponse.json({
            message: "Successfully cloned best campaign with AI optimization",
            basedOn: {
                id: bestCampaign.id,
                name: bestCampaign.name,
                replyRate: `${replyRate}%`
            },
            campaign: newCampaign
        })
    } catch (error) {
        console.error("API POST /v2/ai/clone-best error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
