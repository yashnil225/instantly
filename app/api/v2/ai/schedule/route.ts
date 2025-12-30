import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * POST /api/v2/ai/schedule
 * AI-powered optimal send time recommendation
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { industry, timezone, campaignId } = await req.json()

        // Get historical performance data if campaign provided
        let historicalData = ""
        if (campaignId) {
            const events = await prisma.sendingEvent.findMany({
                where: {
                    type: { in: ["opened", "replied", "clicked"] },
                    lead: {
                        campaignId,
                        campaign: { userId: auth.user.id }
                    }
                },
                select: { createdAt: true, type: true },
                take: 500
            })

            if (events.length > 0) {
                // Group by hour
                const hourCounts: Record<number, number> = {}
                events.forEach(e => {
                    const hour = e.createdAt.getHours()
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1
                })

                historicalData = `Historical engagement peaks: ${JSON.stringify(hourCounts)}`
            }
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
You are a cold email scheduling expert. Recommend the best times to send outreach emails.

Industry: ${industry || "B2B SaaS"}
Timezone: ${timezone || "UTC"}
${historicalData}

Based on industry research and the data above, provide:
1. Best day of week
2. Best time window (hour range)
3. Times to AVOID
4. Reasoning

Respond in JSON:
{
  "bestDay": "Tuesday",
  "bestTimeStart": "9:00 AM",
  "bestTimeEnd": "11:00 AM",
  "avoidTimes": ["Monday morning", "Friday afternoon"],
  "reasoning": "..."
}
`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("Failed to parse AI response")
        }

        const schedule = JSON.parse(jsonMatch[0])

        return NextResponse.json({
            recommendation: schedule,
            basedOn: historicalData ? "Your campaign data + industry research" : "Industry research only"
        })
    } catch (error) {
        console.error("API POST /v2/ai/schedule error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
