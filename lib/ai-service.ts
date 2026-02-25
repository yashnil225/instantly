import { GoogleGenerativeAI } from "@google/generative-ai"

function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    return new GoogleGenerativeAI(apiKey);
}

export async function classifyEmailStatus(subject: string, body: string): Promise<string> {
    const prompt = `
    Analyze the following email reply and categorize it into exactly one of these categories:
    
    - interested: Positive response, curiosity, asking for pricing/demo, "tell me more", "sounds good", "available for a call", "send more info".
    - meeting_booked: Explicitly agreed to a meeting, provided a calendar link, confirmed a specific time, "meeting scheduled", "zoom link attached".
    - not_interested: Polite or blunt rejection, "no thanks", "not now", "doesn't fit", "not interested", "already have a solution".
    - out_of_office: Automated response, away on vacation, maternity/sick leave, "away until [date]", "vacation", "annual leave".
    - wrong_person: Referral to someone else, or saying "not me". CRITICAL: Also include people who have LEFT THE COMPANY, are NO LONGER THERE, or have RETIRED.
    - lost: Hostile, "stop", "scam", "fuck off", "remove me", "unsubscribe", "harsh complaint", "legal threat".

    Email Subject: ${subject}
    Email Body: ${body}

    Respond with ONLY the category name in lowercase. If you are unsure and the message mentioned "leaving", "retired", or "no longer with", prioritize 'wrong_person'.
    `

    if (!process.env.GEMINI_API_KEY) {
        // Fallback robust keyword classifier if no API key
        return fallbackClassify(subject, body)
    }

    try {
        const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text().trim().toLowerCase().replace(/[^a-z_]/g, '')

        // Validate against allowed categories
        const allowed = ['interested', 'meeting_booked', 'not_interested', 'out_of_office', 'wrong_person', 'lost']
        if (allowed.includes(text)) {
            return text
        }
        return 'not_interested' // Safer default
    } catch (error) {
        console.error("Gemini classification failed:", error)
        return fallbackClassify(subject, body)
    }
}

function fallbackClassify(subject: string, body: string): string {
    const text = (subject + " " + body).toLowerCase()

    // Out of Office
    if (
        text.includes("out of office") ||
        text.includes("away until") ||
        text.includes("vacation") ||
        text.includes("annual leave") ||
        text.includes("maternity leave") ||
        text.includes("paternity leave") ||
        text.includes("sick leave") ||
        text.includes("returning on") ||
        text.includes("holiday") ||
        text.includes("oOO")
    ) return "out_of_office"

    // Meeting Booked
    if (
        text.includes("calendar link") ||
        text.includes("zoom link") ||
        text.includes("meeting scheduled") ||
        text.includes("invite sent") ||
        text.includes("see you then") ||
        text.includes("appointment confirmed") ||
        text.includes("hop on a call") ||
        text.includes("chat tomorrow") ||
        text.includes("speak on") ||
        text.includes("meeting request")
    ) return "meeting_booked"

    // Wrong Person / Left Company
    if (
        text.includes("wrong person") ||
        text.includes("not the right contact") ||
        text.includes("left the company") ||
        text.includes("no longer with") ||
        text.includes("no longer works") ||
        text.includes("not in this role") ||
        text.includes("retired") ||
        text.includes("incorrect contact") ||
        text.includes("contact hr") ||
        text.includes("replaced by") ||
        text.includes("former employee") ||
        text.includes("no longer employed") ||
        text.includes("left long ago") ||
        text.includes("past colleague")
    ) return "wrong_person"

    // Lost / Hostile
    if (
        text.includes("fuck") ||
        text.includes("stop") ||
        text.includes("scam") ||
        text.includes("don't email") ||
        text.includes("unsubscribe") ||
        text.includes("remove me") ||
        text.includes("harassment") ||
        text.includes("legal") ||
        text.includes("complaint") ||
        text.includes("report") ||
        text.includes("abuse") ||
        text.includes("don't ever") ||
        text.includes("shame") ||
        text.includes("block") ||
        text.includes("spam report")
    ) return "lost"

    // Interested
    if (
        text.includes("interested") ||
        text.includes("sounds good") ||
        text.includes("tell me more") ||
        text.includes("send over") ||
        text.includes("let's talk") ||
        text.includes("more info") ||
        text.includes("pricing") ||
        text.includes("demo") ||
        text.includes("presentation") ||
        text.includes("available") ||
        text.includes("time for a call") ||
        text.includes("more details") ||
        text.includes("share more") ||
        text.includes("further info") ||
        text.includes("proposal") ||
        text.includes("quote") ||
        text.includes("hearing more")
    ) return "interested"

    // Not Interested
    if (
        text.includes("not interested") ||
        text.includes("no thanks") ||
        text.includes("no thank you") ||
        text.includes("not looking") ||
        text.includes("not at this time") ||
        text.includes("doesn't fit") ||
        text.includes("already have") ||
        text.includes("not a good fit") ||
        text.includes("doesn't alignment") ||
        text.includes("mind later") ||
        text.includes("not looking for")
    ) return "not_interested"

    return "not_interested" // Safer Default
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
        const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" })
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
