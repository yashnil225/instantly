import { prisma } from "./prisma"
import { headers } from "next/headers"
import { checkRateLimit, RATE_LIMITS } from "./rate-limiting"

/**
 * Validates an API key from the request headers
 * Used for PUBLIC API endpoints (v2)
 */
export async function validateApiKey() {
    const headersList = await headers()
    const authHeader = headersList.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { user: null, error: "Unauthorized: Missing or invalid API key" }
    }

    const key = authHeader.split(" ")[1]

    if (!key) {
        return { user: null, error: "Unauthorized: API key is empty" }
    }

    const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    plan: true,
                }
            }
        }
    })

    if (!apiKeyRecord) {
        return { user: null, error: "Unauthorized: Invalid API key" }
    }

    // --- Rate Limiting ---
    const rateLimit = checkRateLimit(apiKeyRecord.id, {
        windowMs: RATE_LIMITS.api.windowMs,
        maxRequests: RATE_LIMITS.api.maxRequests,
        keyPrefix: "v2-api"
    })

    if (!rateLimit.allowed) {
        return {
            user: null,
            error: "Too Many Requests",
            status: 429,
            retryAfter: rateLimit.retryAfter
        }
    }

    // Proactively update lastUsedAt without blocking
    prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() }
    }).catch(console.error)

    return {
        user: apiKeyRecord.user,
        apiKeyId: apiKeyRecord.id,
        error: null,
        rateLimit
    }
}

/**
 * Generates a new random API key
 */
export function generateKey(prefix: string = "inst_") {
    // Generate 32 bytes of random hex
    const randomBytes = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    return `${prefix}${randomBytes}`
}
