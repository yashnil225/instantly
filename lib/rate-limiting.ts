/**
 * Rate Limiting
 * In-memory and Redis-based rate limiting for API protection
 */

// Simple in-memory store for development
const memoryStore = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: Date
    retryAfter?: number // seconds until reset
}

export interface RateLimitConfig {
    windowMs: number // Time window in milliseconds
    maxRequests: number // Max requests per window
    keyPrefix?: string
}

// Default limits for different endpoints
export const RATE_LIMITS = {
    // Authentication
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 min
    signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
    passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 },

    // API endpoints
    api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
    apiStrict: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute

    // Email sending
    emailSend: { windowMs: 60 * 60 * 1000, maxRequests: 500 }, // 500 per hour
    warmup: { windowMs: 60 * 60 * 1000, maxRequests: 100 },

    // Exports
    export: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour

    // AI features
    aiGeneration: { windowMs: 60 * 1000, maxRequests: 20 } // 20 per minute
}

/**
 * Check rate limit (in-memory version)
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now()
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key

    let entry = memoryStore.get(fullKey)

    // Check if window has expired
    if (!entry || now >= entry.resetAt) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs
        }
    }

    // Increment count
    entry.count++
    memoryStore.set(fullKey, entry)

    const allowed = entry.count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - entry.count)
    const resetAt = new Date(entry.resetAt)
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000)

    return {
        allowed,
        remaining,
        resetAt,
        retryAfter
    }
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string, keyPrefix?: string): void {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key
    memoryStore.delete(fullKey)
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now()
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key

    const entry = memoryStore.get(fullKey)

    if (!entry || now >= entry.resetAt) {
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt: new Date(now + config.windowMs)
        }
    }

    const allowed = entry.count < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - entry.count)
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000)

    return {
        allowed,
        remaining,
        resetAt: new Date(entry.resetAt),
        retryAfter
    }
}

/**
 * Middleware-style rate limiter for API routes
 */
export function createRateLimiter(config: RateLimitConfig) {
    return (req: Request, identifier: string): RateLimitResult => {
        return checkRateLimit(identifier, config)
    }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 0 : 1)),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
        ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {})
    }
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of memoryStore.entries()) {
        if (now >= entry.resetAt) {
            memoryStore.delete(key)
            cleaned++
        }
    }

    return cleaned
}

/**
 * Sliding window rate limiter (more accurate but more complex)
 */
const slidingWindowStore = new Map<string, number[]>()

export function checkSlidingWindowRateLimit(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now()
    const windowStart = now - config.windowMs
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key

    // Get existing timestamps
    let timestamps = slidingWindowStore.get(fullKey) || []

    // Remove expired timestamps
    timestamps = timestamps.filter(t => t > windowStart)

    // Check limit
    const allowed = timestamps.length < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - timestamps.length - (allowed ? 1 : 0))

    if (allowed) {
        timestamps.push(now)
        slidingWindowStore.set(fullKey, timestamps)
    }

    // Calculate reset time (when oldest entry expires)
    const resetAt = timestamps.length > 0
        ? new Date(timestamps[0] + config.windowMs)
        : new Date(now + config.windowMs)

    const retryAfter = allowed ? undefined : Math.ceil((timestamps[0] + config.windowMs - now) / 1000)

    return {
        allowed,
        remaining,
        resetAt,
        retryAfter
    }
}

// ========================================
// Redis-based rate limiting (for production)
// ========================================

// Uncomment and use when Redis is available
/*
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function checkRedisRateLimit(
    key: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const fullKey = config.keyPrefix ? `ratelimit:${config.keyPrefix}:${key}` : `ratelimit:${key}`
    const now = Date.now()

    const multi = redis.multi()
    multi.incr(fullKey)
    multi.pttl(fullKey)

    const results = await multi.exec()
    const count = results?.[0]?.[1] as number
    const ttl = results?.[1]?.[1] as number

    if (ttl === -1) {
        // Key exists but no TTL, set it
        await redis.pexpire(fullKey, config.windowMs)
    }

    const allowed = count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count)
    const resetAt = new Date(now + (ttl > 0 ? ttl : config.windowMs))
    const retryAfter = allowed ? undefined : Math.ceil(ttl / 1000)

    return {
        allowed,
        remaining,
        resetAt,
        retryAfter
    }
}
*/

/**
 * IP-based rate limiting helper
 */
export function getClientIP(request: Request): string {
    // Check common headers for proxied requests
    const headers = request.headers

    const xForwardedFor = headers.get('x-forwarded-for')
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim()
    }

    const xRealIP = headers.get('x-real-ip')
    if (xRealIP) {
        return xRealIP
    }

    // Fallback
    return 'unknown'
}

/**
 * User + IP combined rate limiting
 */
export function getUserIPKey(userId: string, request: Request): string {
    const ip = getClientIP(request)
    return `${userId}:${ip}`
}
