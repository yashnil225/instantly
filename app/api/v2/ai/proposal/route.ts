import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * POST /api/v2/ai/proposal
 * Generate a full sales proposal (Problem/Solution/ROI) from a transcript
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { transcript, clientName, myAgencyName } = await req.json()

        if (!transcript) {
            return NextResponse.json({ error: "transcript is required" }, { status: 400 })
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
Generate a professional but "sexy" sales proposal based on this kickoff/sales transcript.
Client Name: ${clientName || "the client"}
My Agency: ${myAgencyName || "Our Agency"}

TRANSCRIPT:
${transcript}

Structure the proposal in Markdown:
1. Executive Summary
2. Problem Analysis (Identify 3 core pain points with estimated $ lost)
3. The Solution (How we solve it)
4. ROI Projection (Estimated revenue increase)
5. Next Steps

Make it sound aggressive and performance-driven.
`

        const result = await model.generateContent(prompt)
        const proposal = result.response.text().trim()

        return NextResponse.json({
            proposal,
            metadata: {
                generatedAt: new Date().toISOString(),
                client: clientName
            }
        })
    } catch (error) {
        console.error("API POST /v2/ai/proposal error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
