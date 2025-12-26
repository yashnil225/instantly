import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

interface SubjectLineRequest {
    productOrService: string
    targetAudience?: string
    tone?: "professional" | "casual" | "urgent" | "friendly" | "humorous"
    includeEmoji?: boolean
    count?: number
    context?: string
}

interface SubjectLineResult {
    subjects: string[]
    reasoning?: string[]
}

/**
 * Generate AI-powered email subject lines using Gemini
 */
export async function generateSubjectLines(request: SubjectLineRequest): Promise<SubjectLineResult> {
    const {
        productOrService,
        targetAudience = "professionals",
        tone = "professional",
        includeEmoji = false,
        count = 5,
        context = ""
    } = request

    const prompt = `Generate ${count} compelling email subject lines for a cold outreach email.

Product/Service: ${productOrService}
Target Audience: ${targetAudience}
Tone: ${tone}
${includeEmoji ? "Include relevant emojis where appropriate." : "Do not use emojis."}
${context ? `Additional context: ${context}` : ""}

Requirements:
- Each subject line should be under 60 characters
- Avoid spam trigger words (free, urgent, act now, etc.)
- Make them curiosity-inducing
- Personalization placeholders: {{firstName}}, {{company}}
- Vary the approaches (question, statement, value prop, etc.)

Return ONLY a JSON object in this exact format:
{
  "subjects": ["subject1", "subject2", ...],
  "reasoning": ["why subject1 works", "why subject2 works", ...]
}`

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" })
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return {
                subjects: parsed.subjects || [],
                reasoning: parsed.reasoning || []
            }
        }

        // Fallback: try to extract lines
        const lines = response.split("\n").filter(line =>
            line.trim() &&
            !line.startsWith("{") &&
            !line.startsWith("}")
        )
        return { subjects: lines.slice(0, count) }
    } catch (error) {
        console.error("AI subject generation failed:", error)
        // Return fallback subjects
        return {
            subjects: getDefaultSubjects(productOrService, tone)
        }
    }
}

/**
 * Fallback subjects if AI fails
 */
function getDefaultSubjects(product: string, tone: string): string[] {
    const templates: Record<string, string[]> = {
        professional: [
            `Quick question about {{company}}'s ${product} strategy`,
            `{{firstName}}, thought you'd find this relevant`,
            `Idea for improving {{company}}'s results`,
            `Following up on ${product}`,
            `{{firstName}} - quick thought for you`
        ],
        casual: [
            `Hey {{firstName}}, got a sec?`,
            `This might interest you`,
            `Quick idea for {{company}}`,
            `Thought of you when I saw this`,
            `{{firstName}}, you'll want to see this`
        ],
        urgent: [
            `{{firstName}}, time-sensitive opportunity`,
            `Before the week ends...`,
            `Don't miss this, {{firstName}}`,
            `Quick - need your input`,
            `{{firstName}}, brief window of opportunity`
        ],
        friendly: [
            `Hi {{firstName}}! Quick question`,
            `Hope you're doing great, {{firstName}}`,
            `{{firstName}}, making your day easier`,
            `A little something for {{company}}`,
            `{{firstName}}, thought you'd appreciate this`
        ],
        humorous: [
            `{{firstName}}, I promise this isn't another boring email`,
            `Not a robot here - just {{firstName}}'s new favorite`,
            `{{company}}'s secret weapon (it's me)`,
            `This email will self-destruct... just kidding`,
            `{{firstName}}, please don't send this to spam 😅`
        ]
    }

    return templates[tone] || templates.professional
}

/**
 * Score a subject line for spam likelihood
 */
export function scoreSubjectLine(subject: string): {
    score: number // 0-100, higher is better
    issues: string[]
    suggestions: string[]
} {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100

    // Spam trigger words
    const spamWords = [
        "free", "urgent", "act now", "limited time", "click here",
        "buy now", "order now", "winner", "congratulations", "guarantee",
        "100%", "amazing", "incredible", "exclusive deal", "make money",
        "earn", "cash", "bonus", "prize", "selected"
    ]

    const lowerSubject = subject.toLowerCase()

    for (const word of spamWords) {
        if (lowerSubject.includes(word)) {
            score -= 15
            issues.push(`Contains spam trigger word: "${word}"`)
        }
    }

    // All caps check
    if (subject === subject.toUpperCase() && subject.length > 3) {
        score -= 20
        issues.push("Subject is in ALL CAPS")
        suggestions.push("Use normal capitalization")
    }

    // Excessive punctuation
    const exclamations = (subject.match(/!/g) || []).length
    if (exclamations > 1) {
        score -= 10 * (exclamations - 1)
        issues.push(`Too many exclamation marks (${exclamations})`)
        suggestions.push("Use at most one exclamation mark")
    }

    // Length check
    if (subject.length > 60) {
        score -= 10
        issues.push("Subject is too long (>60 characters)")
        suggestions.push("Shorten to under 60 characters for mobile")
    }

    if (subject.length < 10) {
        score -= 5
        issues.push("Subject is very short")
        suggestions.push("Add more context for better engagement")
    }

    // Personalization check
    if (!subject.includes("{{") && !subject.includes("firstName")) {
        suggestions.push("Consider adding personalization like {{firstName}}")
    }

    // Question bonus
    if (subject.includes("?")) {
        score += 5
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        issues,
        suggestions
    }
}

/**
 * Generate A/B test variants of a subject line
 */
export async function generateABVariants(originalSubject: string): Promise<string[]> {
    const prompt = `Given this email subject line: "${originalSubject}"

Generate 3 A/B test variants that:
1. Keep the same intent but different wording
2. Try different psychological triggers (curiosity, urgency, social proof)
3. Vary the length

Return ONLY a JSON array of strings: ["variant1", "variant2", "variant3"]`

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" })
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        return []
    } catch {
        // Fallback: simple variants
        return [
            originalSubject.replace(/\?$/, ""),
            `Re: ${originalSubject}`,
            originalSubject.length > 30
                ? originalSubject.substring(0, 30) + "..."
                : originalSubject + " - thoughts?"
        ]
    }
}
