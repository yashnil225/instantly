import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    if (!genAI) {
        return NextResponse.json({ error: 'AI not configured on server' }, { status: 500 })
    }

    try {
        const { prompt, tone = "professional" } = await req.json()
        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" })

        const strictPrompt = `
        You are a world-class B2B sales copywriter.
        Tone: ${tone}.
        Context/Offer: "${prompt}".
        
        Write a 3-step sequence. Return ONLY valid JSON:
        [
            { "day": 0, "subject": "...", "body": "..." },
            { "day": 3, "subject": "...", "body": "..." },
            { "day": 7, "subject": "...", "body": "..." }
        ]
        `

        const result = await model.generateContent(strictPrompt)
        const text = result.response.text()
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const steps = JSON.parse(cleanJson)

        return NextResponse.json({ steps })
    } catch (error) {
        console.error("API POST /v2/ai/generate error:", error)
        return NextResponse.json({ error: "Failed to generate AI content" }, { status: 500 })
    }
}
