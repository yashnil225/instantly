import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
// In a real app, strict env checks
const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(req: Request) {
    if (!genAI) {
        return NextResponse.json({ error: 'AI not configured (Missing API Key)' }, { status: 500 })
    }

    try {
        const { prompt } = await req.json()

        const model = genAI.getGenerativeModel({ model: "gemini-pro" })

        const strictPrompt = `
        You are a world-class B2B sales copywriter (like specific frameworks: AIDA, PAS, BAB).
        Goal: Write a highly personalized 3-step cold email sequence. 
        Context/Offer: "${prompt}".
        
        Guidelines:
        - Tone: Conversational, professional, NOT salesy or spammy.
        - Structure: Short paragraphs, clear call to action (soft ask).
        - Variant 1 (Day 0): "Hook" - Focus on their problem or a relevant observation.
        - Variant 2 (Day 3): "Value" - Briefly mention how we solve it or show social proof.
        - Variant 3 (Day 7): "Breakup/Bump" - One last polite nudge.
        
        Return ONLY valid JSON in this exact format (no markdown):
        [
            { "day": 0, "subject": "Short, catchy subject", "body": "Email body with {{firstName}}..." },
            { "day": 3, "subject": "Re: previous subject", "body": "Follow up body..." },
            { "day": 7, "subject": "Final thoughts?", "body": "Final body..." }
        ]
        `

        const result = await model.generateContent(strictPrompt)
        const response = await result.response
        const text = response.text()

        // Clean up markdown code blocks if the AI adds them
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()

        const steps = JSON.parse(cleanJson)

        return NextResponse.json({ steps })

    } catch (error: any) {
        console.error("AI Gen Failed:", error)
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
    }
}
