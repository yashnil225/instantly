/**
 * Comprehensive Spam & Deliverability Engine
 * Evaluates subject and body content against 100+ spam filters, keyword triggers,
 * structural penalties, and provides automatic safe replacements.
 */

export interface SpamCheckResult {
    score: number // 0-100, higher is better (100 = 100% Safe / Inbox Ready)
    grade: "A" | "B" | "C" | "D" | "F"
    status: "safe" | "moderate" | "risky" | "critical"
    passed: boolean
    issues: SpamIssue[]
    suggestions: string[]
    wordAnalysis: WordAnalysis[]
    linkCheck: LinkCheckResult
    metrics: {
        wordCount: number
        subjectLength: number
        hasPersonalization: boolean
        linkCount: number
        exclamationCount: number
        questionCount: number
        allCaps: boolean
    }
}

export interface SpamIssue {
    type: "critical" | "warning" | "info"
    category: "keywords" | "subject" | "links" | "formatting" | "personalization" | "length"
    message: string
    impact: number
}

export interface WordAnalysis {
    word: string
    severity: "high" | "medium" | "low"
    alternative?: string
    count: number
    location: "subject" | "body" | "both"
}

export interface LinkCheckResult {
    totalLinks: number
    shortenerLinks: number
    issues: string[]
}

// 100+ Cold Email Trigger Words with safe, natural alternatives
export const SPAM_TRIGGER_WORDS: Record<string, { severity: "high" | "medium" | "low"; alternative?: string }> = {
    // High Severity (Major Spam Flags)
    "100% free": { severity: "high", alternative: "complimentary" },
    "100% satisfied": { severity: "high", alternative: "fully assured" },
    "act now": { severity: "high", alternative: "take a look" },
    "apply now": { severity: "high", alternative: "reach out" },
    "buy direct": { severity: "high", alternative: "partner directly" },
    "buy now": { severity: "high", alternative: "get started" },
    "cash bonus": { severity: "high", alternative: "incentive" },
    "casino": { severity: "high" },
    "certified": { severity: "high" },
    "cheap": { severity: "high", alternative: "affordable" },
    "click here": { severity: "high", alternative: "view details" },
    "click now": { severity: "high", alternative: "see here" },
    "click this link": { severity: "high", alternative: "find it here" },
    "congratulations": { severity: "high" },
    "credit card": { severity: "high" },
    "cure": { severity: "high" },
    "dear friend": { severity: "high", alternative: "hi {{firstName}}" },
    "direct marketing": { severity: "high" },
    "double your": { severity: "high", alternative: "substantially increase" },
    "earn extra cash": { severity: "high" },
    "earn money": { severity: "high" },
    "eliminate debt": { severity: "high" },
    "exclusive deal": { severity: "high", alternative: "exclusive opportunity" },
    "fast cash": { severity: "high" },
    "financial freedom": { severity: "high" },
    "free": { severity: "high", alternative: "complimentary" },
    "free consultation": { severity: "high", alternative: "brief exploratory call" },
    "free gift": { severity: "high", alternative: "courtesy resource" },
    "free info": { severity: "high", alternative: "overview" },
    "free trial": { severity: "high", alternative: "trial access" },
    "get paid": { severity: "high" },
    "guarantee": { severity: "high", alternative: "commitment" },
    "guaranteed": { severity: "high", alternative: "proven" },
    "income from home": { severity: "high" },
    "increase sales": { severity: "high", alternative: "grow revenue" },
    "instant": { severity: "high", alternative: "immediate" },
    "limited time": { severity: "high", alternative: "this month" },
    "make money": { severity: "high" },
    "million dollars": { severity: "high" },
    "miracle": { severity: "high" },
    "money back": { severity: "high" },
    "no credit check": { severity: "high" },
    "no fees": { severity: "high" },
    "no obligation": { severity: "high", alternative: "zero commitment" },
    "no risk": { severity: "high", alternative: "low friction" },
    "not spam": { severity: "high" },
    "once in a lifetime": { severity: "high" },
    "one time offer": { severity: "high" },
    "order now": { severity: "high", alternative: "place request" },
    "promise you": { severity: "high", alternative: "aim to" },
    "pure profit": { severity: "high" },
    "risk-free": { severity: "high", alternative: "worry-free" },
    "save big": { severity: "high", alternative: "optimize costs" },
    "secret": { severity: "high" },
    "special promotion": { severity: "high", alternative: "tailored initiative" },
    "this isn't spam": { severity: "high" },
    "unlimited": { severity: "high", alternative: "comprehensive" },
    "unsolicited": { severity: "high" },
    "urgent": { severity: "high", alternative: "time-sensitive" },
    "valuable": { severity: "high", alternative: "relevant" },
    "viagra": { severity: "high" },
    "winner": { severity: "high" },
    "you have been selected": { severity: "high" },

    // Medium Severity
    "affordable": { severity: "medium", alternative: "cost-effective" },
    "amazing": { severity: "medium", alternative: "impressive" },
    "as seen on": { severity: "medium" },
    "bargain": { severity: "medium" },
    "be your own boss": { severity: "medium" },
    "best price": { severity: "medium", alternative: "competitive rates" },
    "bonus": { severity: "medium", alternative: "additional benefit" },
    "cancel anytime": { severity: "medium", alternative: "flexible terms" },
    "compare rates": { severity: "medium" },
    "discount": { severity: "medium", alternative: "preferred pricing" },
    "don't delete": { severity: "medium" },
    "drastically reduce": { severity: "medium", alternative: "reduce" },
    "easy terms": { severity: "medium" },
    "exclusive": { severity: "medium", alternative: "curated" },
    "extra income": { severity: "medium" },
    "fantastic deal": { severity: "medium" },
    "for only $": { severity: "medium" },
    "great offer": { severity: "medium", alternative: "proposal" },
    "huge discount": { severity: "medium", alternative: "special rate" },
    "incredible": { severity: "medium", alternative: "notable" },
    "lowest price": { severity: "medium", alternative: "competitive rate" },
    "lowest rates": { severity: "medium" },
    "mass email": { severity: "medium" },
    "money making": { severity: "medium" },
    "no catch": { severity: "medium" },
    "no experience": { severity: "medium" },
    "no hidden costs": { severity: "medium" },
    "no strings attached": { severity: "medium", alternative: "straightforward" },
    "offer expires": { severity: "medium", alternative: "valid through" },
    "passionate": { severity: "medium" },
    "potential earnings": { severity: "medium" },
    "prize": { severity: "medium" },
    "quote": { severity: "medium", alternative: "estimate" },
    "refund": { severity: "medium" },
    "save $": { severity: "medium" },
    "special offer": { severity: "medium", alternative: "idea" },
    "unbelievable": { severity: "medium" },
    "while supplies last": { severity: "medium" },

    // Low Severity
    "action": { severity: "low" },
    "deal": { severity: "low", alternative: "partnership" },
    "limited": { severity: "low" },
    "marketing": { severity: "low" },
    "offer": { severity: "low", alternative: "concept" },
    "opportunity": { severity: "low" },
    "promotion": { severity: "low" },
    "sale": { severity: "low" },
    "solution": { severity: "low" }
}

const URL_SHORTENERS = [
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "j.mp", "su.pr", "tiny.cc", "rebrand.ly", "cutt.ly"
]

/**
 * Strips HTML tags and decodes common entities to plain text
 */
export function stripHtml(html: string): string {
    if (!html) return ""
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
}

/**
 * Checks subject and body content for deliverability health and spam triggers
 */
export async function checkSpamScore(subject: string = "", body: string = ""): Promise<SpamCheckResult> {
    const plainBody = stripHtml(body)
    const rawSubject = (subject || "").trim()
    const rawBody = (plainBody || "").trim()

    const subjectLower = rawSubject.toLowerCase()
    const bodyLower = rawBody.toLowerCase()
    const fullContentLower = `${subjectLower} ${bodyLower}`

    const issues: SpamIssue[] = []
    const wordAnalysisMap = new Map<string, WordAnalysis>()
    const suggestions: string[] = []

    let score = 100

    // 1. Spam Trigger Words Analysis
    for (const [trigger, info] of Object.entries(SPAM_TRIGGER_WORDS)) {
        const regex = new RegExp(`\\b${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        const subjectMatches = (rawSubject.match(regex) || []).length
        const bodyMatches = (rawBody.match(regex) || []).length
        const totalMatches = subjectMatches + bodyMatches

        if (totalMatches > 0) {
            const location = subjectMatches > 0 && bodyMatches > 0 ? "both" : subjectMatches > 0 ? "subject" : "body"
            const impact = (info.severity === "high" ? 14 : info.severity === "medium" ? 7 : 3) * totalMatches
            score -= impact

            wordAnalysisMap.set(trigger, {
                word: trigger,
                severity: info.severity,
                alternative: info.alternative,
                count: totalMatches,
                location
            })

            issues.push({
                type: info.severity === "high" ? "critical" : info.severity === "medium" ? "warning" : "info",
                category: "keywords",
                message: `Found "${trigger}" in ${location}${info.alternative ? ` &rarr; Recommended: "${info.alternative}"` : ""}`,
                impact
            })
        }
    }

    // 2. Subject Line Inspections
    if (rawSubject.length > 0) {
        // ALL CAPS check
        const lettersOnly = rawSubject.replace(/[^a-zA-Z]/g, "")
        const isAllCaps = lettersOnly.length > 4 && lettersOnly === lettersOnly.toUpperCase()
        if (isAllCaps) {
            score -= 22
            issues.push({
                type: "critical",
                category: "subject",
                message: "Subject line is written in ALL CAPS (Triggers aggressive spam filters)",
                impact: 22
            })
            suggestions.push("Use standard sentence case for your subject line.")
        }

        // Subject Line Length
        if (rawSubject.length > 60) {
            score -= 8
            issues.push({
                type: "warning",
                category: "subject",
                message: `Subject line is too long (${rawSubject.length} chars). Best: 20-50 chars.`,
                impact: 8
            })
            suggestions.push("Keep subject lines under 50 characters to prevent truncation on mobile.")
        } else if (rawSubject.length < 5) {
            score -= 5
            issues.push({
                type: "info",
                category: "subject",
                message: "Subject line is very short.",
                impact: 5
            })
        }

        // Subject Punctuation Check
        if (rawSubject.includes("!") || rawSubject.includes("$") || (rawSubject.match(/\?/g) || []).length > 1) {
            score -= 10
            issues.push({
                type: "warning",
                category: "subject",
                message: "Subject contains exclamation marks or dollar signs.",
                impact: 10
            })
            suggestions.push("Avoid exclamation marks ('!') and symbols ('$', '???') in the subject.")
        }
    } else {
        score -= 25
        issues.push({
            type: "critical",
            category: "subject",
            message: "Missing subject line.",
            impact: 25
        })
    }

    // 3. Excessive Punctuation in Body
    const exclamationCount = (rawBody.match(/!/g) || []).length
    if (exclamationCount > 2) {
        const impact = Math.min(15, (exclamationCount - 2) * 4)
        score -= impact
        issues.push({
            type: "warning",
            category: "formatting",
            message: `Excessive exclamation points (${exclamationCount} found).`,
            impact
        })
        suggestions.push("Limit exclamation marks to 1 or 0 in cold outreach.")
    }

    const questionCount = (rawBody.match(/\?/g) || []).length
    if (questionCount > 4) {
        score -= 6
        issues.push({
            type: "info",
            category: "formatting",
            message: `Multiple questions asked (${questionCount}). Keep calls to action focused.`,
            impact: 6
        })
    }

    // 4. Links & Shorteners Audit
    const linkCheck = checkLinks(body)
    if (linkCheck.shortenerLinks > 0) {
        const impact = 25 * linkCheck.shortenerLinks
        score -= impact
        issues.push({
            type: "critical",
            category: "links",
            message: `Contains ${linkCheck.shortenerLinks} URL shortener link(s) (e.g. bit.ly). Major spam flag.`,
            impact
        })
        suggestions.push("Never use URL shorteners in cold emails. Use clean, direct domain links.")
    }

    if (linkCheck.totalLinks > 2) {
        const impact = (linkCheck.totalLinks - 2) * 6
        score -= impact
        issues.push({
            type: "warning",
            category: "links",
            message: `Too many links (${linkCheck.totalLinks} links found). Best practice: 0-1 link max.`,
            impact
        })
        suggestions.push("Remove non-essential links. Cold emails with 0-1 link have 3.2x higher inbox placement.")
    }

    // 5. Personalization Variables Check
    const hasPersonalization = fullContentLower.includes("{{") || fullContentLower.includes("firstname")
    if (!hasPersonalization) {
        score -= 8
        issues.push({
            type: "info",
            category: "personalization",
            message: "No personalization tags detected (e.g. {{firstName}}, {{company}}).",
            impact: 8
        })
        suggestions.push("Include dynamic tags like {{firstName}} to avoid generic blast detection.")
    }

    // 6. Word Count & Readability
    const wordCount = rawBody.split(/\s+/).filter(Boolean).length
    if (wordCount > 0 && wordCount < 25) {
        score -= 6
        issues.push({
            type: "info",
            category: "length",
            message: `Email body is very brief (${wordCount} words).`,
            impact: 6
        })
    } else if (wordCount > 180) {
        score -= 10
        issues.push({
            type: "warning",
            category: "length",
            message: `Email is too lengthy (${wordCount} words). Optimal cold email: 50-125 words.`,
            impact: 10
        })
        suggestions.push("Shorten your email. Busy executives prefer quick 2-3 sentence pitches.")
    }

    // Final Calculation
    const finalScore = Math.max(0, Math.min(100, Math.round(score)))
    const grade: SpamCheckResult["grade"] =
        finalScore >= 90 ? "A" :
        finalScore >= 78 ? "B" :
        finalScore >= 62 ? "C" :
        finalScore >= 45 ? "D" : "F"

    const status: SpamCheckResult["status"] =
        finalScore >= 85 ? "safe" :
        finalScore >= 70 ? "moderate" :
        finalScore >= 50 ? "risky" : "critical"

    return {
        score: finalScore,
        grade,
        status,
        passed: finalScore >= 70,
        issues: issues.sort((a, b) => b.impact - a.impact),
        suggestions: Array.from(new Set(suggestions)),
        wordAnalysis: Array.from(wordAnalysisMap.values()),
        linkCheck,
        metrics: {
            wordCount,
            subjectLength: rawSubject.length,
            hasPersonalization,
            linkCount: linkCheck.totalLinks,
            exclamationCount,
            questionCount,
            allCaps: rawSubject.length > 4 && rawSubject === rawSubject.toUpperCase()
        }
    }
}

/**
 * Automatically cleans known spam trigger words from subject and body
 * using safe, deliverability-friendly alternatives.
 */
export function autoFixSpamWords(subject: string, body: string): { fixedSubject: string; fixedBody: string; replacementsCount: number } {
    let fixedSubject = subject
    let fixedBody = body
    let replacementsCount = 0

    for (const [trigger, info] of Object.entries(SPAM_TRIGGER_WORDS)) {
        if (!info.alternative) continue

        const regex = new RegExp(`\\b${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')

        if (regex.test(fixedSubject)) {
            fixedSubject = fixedSubject.replace(regex, info.alternative)
            replacementsCount++
        }

        if (regex.test(fixedBody)) {
            fixedBody = fixedBody.replace(regex, info.alternative)
            replacementsCount++
        }
    }

    // Clean multiple exclamation marks
    if ((fixedSubject.match(/!/g) || []).length > 0) {
        fixedSubject = fixedSubject.replace(/!+/g, "")
    }

    return {
        fixedSubject,
        fixedBody,
        replacementsCount
    }
}

function checkLinks(body: string): LinkCheckResult {
    const urlRegex = /https?:\/\/[^\s<>"']+/gi
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

export function getSpamScoreColor(score: number): string {
    if (score >= 85) return "text-emerald-400"
    if (score >= 70) return "text-amber-400"
    if (score >= 50) return "text-orange-400"
    return "text-rose-500"
}

export function getSpamBadgeColor(status: SpamCheckResult["status"]): string {
    switch (status) {
        case "safe": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        case "moderate": return "bg-amber-500/10 text-amber-400 border-amber-500/30"
        case "risky": return "bg-orange-500/10 text-orange-400 border-orange-500/30"
        case "critical": return "bg-rose-500/10 text-rose-400 border-rose-500/30"
    }
}
