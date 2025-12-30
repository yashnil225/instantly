import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * POST /api/v2/ai/analyze-onboarding
 * Extract campaign parameters (offer, target, pricing) from a kickoff transcript
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { transcript } = await req.json()

        if (!transcript) {
            return NextResponse.json({ error: "transcript is required" }, { status: 400 })
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
You are an expert sales strategist. Analyze this kickoff call transcript and extract key campaign details.

TRANSCRIPT:
${transcript}

Extract the following in JSON format:
{
  "offer": "Core value proposition extracted",
  "pricing": "Pricing/packages mentioned",
  "targetAudience": "Ideal customer profile / industry",
  "keyObjections": ["Objection 1", "Objection 2"],
  "guarantee": "Any guarantee mentioned (e.g., 15 meetings or free)",
  "suggestedCampaignName": "A catchy name for this campaign"
}
`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("Failed to parse AI response")
        }

        const analysis = JSON.parse(jsonMatch[0])

        return NextResponse.json({
            analysis,
            usageTip: "You can now pass this 'offer' and 'targetAudience' to the /api/v2/ai/generate endpoint to create your sequence."
        })
    } catch (error) {
        console.error("API POST /v2/ai/analyze-onboarding error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
