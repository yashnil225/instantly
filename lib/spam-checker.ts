/**
 * Enhanced Spam Score Checker
 * Comprehensive analysis of email content for spam triggers before sending
 */

export interface SpamCheckResult {
    score: number // 0-100, higher is better (less spammy)
    grade: "A" | "B" | "C" | "D" | "F"
    passed: boolean
    issues: SpamIssue[]
    suggestions: string[]
    wordAnalysis: WordAnalysis[]
    linkCheck: LinkCheckResult
}

export interface SpamIssue {
    type: "critical" | "warning" | "info"
    message: string
    impact: number
}

export interface WordAnalysis {
    word: string
    severity: "high" | "medium" | "low"
    alternative?: string
}

export interface LinkCheckResult {
    totalLinks: number
    shortenerLinks: number
    issues: string[]
}

// Spam trigger words with severity and alternatives
const SPAM_WORDS: Record<string, { severity: "high" | "medium" | "low"; alternative?: string }> = {
    // High severity - major spam triggers
    "free": { severity: "high", alternative: "complimentary" },
    "act now": { severity: "high", alternative: "take action" },
    "limited time": { severity: "high", alternative: "time-sensitive" },
    "urgent": { severity: "high", alternative: "important" },
    "click here": { severity: "high", alternative: "learn more" },
    "buy now": { severity: "high", alternative: "get started" },
    "order now": { severity: "high", alternative: "place your order" },
    "100% free": { severity: "high" },
    "winner": { severity: "high" },
    "congratulations": { severity: "high" },
    "cash bonus": { severity: "high" },
    "make money": { severity: "high" },
    "earn extra": { severity: "high" },
    "million dollars": { severity: "high" },
    "credit card": { severity: "high" },
    "no credit check": { severity: "high" },
    "double your": { severity: "high" },
    "eliminate debt": { severity: "high" },

    // Medium severity
    "guarantee": { severity: "medium", alternative: "promise" },
    "no obligation": { severity: "medium" },
    "risk-free": { severity: "medium", alternative: "worry-free" },
    "special offer": { severity: "medium", alternative: "opportunity" },
    "exclusive deal": { severity: "medium", alternative: "exclusive opportunity" },
    "lowest price": { severity: "medium" },
    "best price": { severity: "medium" },
    "save big": { severity: "medium", alternative: "save" },
    "huge discount": { severity: "medium" },
    "amazing": { severity: "medium" },
    "incredible": { severity: "medium" },
    "unbelievable": { severity: "medium" },
    "once in a lifetime": { severity: "medium" },
    "don't delete": { severity: "medium" },
    "this isn't spam": { severity: "medium" },
    "not spam": { severity: "medium" },

    // Low severity
    "discount": { severity: "low" },
    "offer": { severity: "low" },
    "sale": { severity: "low" },
    "promotion": { severity: "low" },
    "deal": { severity: "low" },
    "bonus": { severity: "low" },
    "limited": { severity: "low" }
}

// URL shorteners that trigger spam filters
const URL_SHORTENERS = [
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "j.mp", "su.pr", "tiny.cc"
]

/**
 * Check email content for spam issues - Enhanced version
 */
export async function checkSpamScore(subject: string, body: string): Promise<SpamCheckResult> {
    const issues: SpamIssue[] = []
    const wordAnalysis: WordAnalysis[] = []
    const suggestions: string[] = []
    let score = 100

    const fullContent = `${subject} ${body}`.toLowerCase()

    // Check for spam words
    for (const [word, info] of Object.entries(SPAM_WORDS)) {
        if (fullContent.includes(word.toLowerCase())) {
            const impact = info.severity === "high" ? 15 : info.severity === "medium" ? 8 : 3
            score -= impact

            wordAnalysis.push({
                word,
                severity: info.severity,
                alternative: info.alternative
            })

            issues.push({
                type: info.severity === "high" ? "critical" : info.severity === "medium" ? "warning" : "info",
                message: `Contains "${word}"${info.alternative ? ` - consider "${info.alternative}" instead` : ""}`,
                impact
            })
        }
    }

    // Check subject line
    if (subject === subject.toUpperCase() && subject.length > 3) {
        score -= 20
        issues.push({
            type: "critical",
            message: "Subject line is in ALL CAPS",
            impact: 20
        })
        suggestions.push("Use normal capitalization in subject line")
    }

    // Excessive punctuation
    const exclamations = (fullContent.match(/!/g) || []).length
    if (exclamations > 2) {
        const impact = 5 * (exclamations - 2)
        score -= impact
        issues.push({
            type: "warning",
            message: `Too many exclamation marks (${exclamations})`,
            impact
        })
        suggestions.push("Reduce exclamation marks to 1-2 maximum")
    }

    // Check for links
    const linkCheck = checkLinks(body)
    if (linkCheck.shortenerLinks > 0) {
        const impact = 15 * linkCheck.shortenerLinks
        score -= impact
        issues.push({
            type: "critical",
            message: `Contains ${linkCheck.shortenerLinks} URL shortener link(s)`,
            impact
        })
        suggestions.push("Use full URLs instead of URL shorteners")
    }

    if (linkCheck.totalLinks > 3) {
        score -= 5
        issues.push({
            type: "warning",
            message: `Too many links (${linkCheck.totalLinks})`,
            impact: 5
        })
        suggestions.push("Reduce the number of links to 2-3")
    }

    // Check for personalization
    if (!fullContent.includes("{{") && !fullContent.includes("firstname")) {
        suggestions.push("Add personalization (e.g., {{firstName}}) to improve engagement")
    }

    // Check text length
    if (body.length < 100) {
        score -= 5
        issues.push({
            type: "info",
            message: "Email body is very short",
            impact: 5
        })
    }

    // Determine grade
    const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F"

    return {
        score: Math.max(0, Math.min(100, score)),
        grade,
        passed: score >= 60,
        issues: issues.sort((a, b) => b.impact - a.impact),
        suggestions,
        wordAnalysis,
        linkCheck
    }
}

/**
 * Check links in email body
 */
function checkLinks(body: string): LinkCheckResult {
    const urlRegex = /https?:\/\/[^\s<>]+/gi
    const links = body.match(urlRegex) || []
    const issues: string[] = []
    let shortenerLinks = 0

    for (const link of links) {
        for (const shortener of URL_SHORTENERS) {
            if (link.toLowerCase().includes(shortener)) {
                shortenerLinks++
                issues.push(`URL shortener detected: ${shortener}`)
                break
            }
        }
    }

    return { totalLinks: links.length, shortenerLinks, issues }
}

/**
 * Get spam score color for UI
 */
export function getSpamScoreColor(score: number): string {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
}

/**
 * Get grade color for UI
 */
export function getGradeColor(grade: string): string {
    switch (grade) {
        case "A": return "bg-green-500"
        case "B": return "bg-green-400"
        case "C": return "bg-yellow-500"
        case "D": return "bg-orange-500"
        case "F": return "bg-red-500"
        default: return "bg-gray-500"
    }
}
