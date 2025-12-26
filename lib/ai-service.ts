import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function classifyEmailStatus(subject: string, body: string): Promise<string> {
    const prompt = `
    Analyze the following email reply and categorize it into exactly one of these categories:
    - interested (positive response, wants to meet, asks for more info)
    - meeting_booked (explicitly agreed to a meeting or time)
    - not_interested (polite or blunt rejection)
    - out_of_office (automated response, away until date)
    - wrong_person (referral to someone else or saying not me)
    - lost (hostile, unsubscribe request, or definitive goodbye)

    Email Subject: ${subject}
    Email Body: ${body}

    Respond with ONLY the category name in lowercase.
    `

    if (!process.env.GEMINI_API_KEY) {
        // Fallback robust keyword classifier if no API key
        return fallbackClassify(subject, body)
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text().trim().toLowerCase().replace(/[^a-z_]/g, '')

        // Validate against allowed categories
        const allowed = ['interested', 'meeting_booked', 'not_interested', 'out_of_office', 'wrong_person', 'lost']
        if (allowed.includes(text)) {
            return text
        }
        return 'interested' // Default to interested if uncertain but engaging
    } catch (error) {
        console.error("Gemini classification failed:", error)
        return fallbackClassify(subject, body)
    }
}

function fallbackClassify(subject: string, body: string): string {
    const text = (subject + " " + body).toLowerCase()

    if (text.includes("out of office") || text.includes("away until") || text.includes("vacation")) return "out_of_office"
    if (text.includes("meeting") || text.includes("calendar") || text.includes("schedule a call")) return "meeting_booked"
    if (text.includes("interested") || text.includes("sounds good") || text.includes("tell me more") || text.includes("send over")) return "interested"
    if (text.includes("not interested") || text.includes("no thanks") || text.includes("remove me")) return "not_interested"
    if (text.includes("wrong person") || text.includes("not the right contact")) return "wrong_person"
    if (text.includes("fuck") || text.includes("stop") || text.includes("scam") || text.includes("don't email")) return "lost"

    return "interested" // Default
}

export async function determineSimilarity(target: string, candidate: string): Promise<number> {
    const prompt = `
    Compare the following two email contents and determine their semantic similarity on a scale of 0 to 100.
    Similarity means they express the same intent (e.g., both are interested, both are not interested, both ask for a demo).

    Email 1: ${target}
    Email 2: ${candidate}

    Respond with ONLY a number between 0 and 100.
    `

    if (!process.env.GEMINI_API_KEY) {
        return target.toLowerCase() === candidate.toLowerCase() ? 100 : 20
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text().trim().replace(/[^0-9]/g, '')
        const score = parseInt(text)
        return isNaN(score) ? 20 : score
    } catch (error) {
        console.error("Similarity calculation failed:", error)
        return 20
    }
}
