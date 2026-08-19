import { prisma } from './prisma'
import { sendEmail } from './email'

interface WarmupConfig {
    startLimit: number      // Start with this many emails per day
    maxLimit: number        // Max emails per day after warmup
    increasePerDay: number  // How many to increase daily
    replyRate: number       // Target reply rate (%)
}

const DEFAULT_CONFIG: WarmupConfig = {
    startLimit: 10,
    maxLimit: 50,
    increasePerDay: 5,
    replyRate: 30
}

/**
 * Calculate health score based on account performance
 * Health score starts at 100 and adjusts based on:
 * - Successful warmup sends (+1 per send, max +10 per day)
 * - Reply rates (+5 if reply rate > 30%)
 * - Pool participation (+5 if opted in)
 * - Bounces (-10 per bounce)
 */
export async function calculateAndUpdateHealthScore(accountId: string): Promise<number> {
    const account = await prisma.emailAccount.findUnique({
        where: { id: accountId },
        include: {
            warmupLogs: {
                where: {
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            }
        }
    })

    if (!account) return 100

    // Get last 7 days of activity
    const lastWeekLogs = account.warmupLogs || []

    // Calculate metrics
    const totalSent = lastWeekLogs.filter(l => l.action === 'send' || l.action === 'pool_send').length
    const totalReplies = lastWeekLogs.filter(l => l.action === 'auto_reply' || l.action === 'reply').length
    const totalBounces = account.bounceCount || 0
    const isPoolParticipant = account.warmupPoolOptIn

    // Calculate reply rate
    const replyRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0

    // Base score starts at 100
    let healthScore = 100

    // Positive factors
    if (totalSent > 0) {
        // +1 for each successful send (max +10)
        healthScore += Math.min(totalSent * 0.5, 10)
    }

    if (replyRate >= 30) {
        // Good reply rate bonus
        healthScore += 5
    }

    if (isPoolParticipant) {
        // Pool participation bonus
        healthScore += 3
    }

    // Negative factors
    if (totalBounces > 0) {
        // -10 per bounce
        healthScore -= Math.min(totalBounces * 10, 30)
    }

    // Ensure score stays within 0-100 range
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)))

    // Only update if significantly different (avoid tiny fluctuations)
    if (Math.abs(healthScore - (account.healthScore || 100)) >= 1) {
        await prisma.emailAccount.update({
            where: { id: accountId },
            data: { healthScore }
        })
    }

    return healthScore
}

/**
 * Log warmup activity for tracking
 */
async function logWarmupActivity(
    accountId: string,
    action: 'send' | 'receive' | 'pool_send' | 'pool_receive' | 'auto_reply' | 'spam_rescue',
    details?: string,
    recipientEmail?: string
) {
    try {
        await prisma.warmupLog.create({
            data: {
                accountId,
                action,
                details: details || null,
                toEmail: recipientEmail || null,
                warmupId: `warmup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date()
            }
        })
    } catch (error) {
        console.error(`Failed to log warmup activity:`, error)
    }
}

export function calculateWarmupLimit(account: any): number {
    // Use configured warmup goal even if disabled, so UI shows correct target
    const maxLimit = account.warmupDailyLimit ?? DEFAULT_CONFIG.maxLimit  // Default: 50

    if (!account.warmupEnabled) {
        return maxLimit
    }

    // Use account's configured warmup settings with proper defaults from schema
    const dailyIncrease = account.warmupDailyIncrease ?? DEFAULT_CONFIG.increasePerDay  // Default: 5

    // Use configured start limit or default to 10
    const startLimit = account.warmupStartLimit ?? DEFAULT_CONFIG.startLimit  // Default: 10

    // Get current warmup day
    const currentDay = account.warmupCurrentDay || 1

    // Calculate current warmup limit: starts at startLimit, increases by dailyIncrease each day
    const calculatedLimit = startLimit + ((currentDay - 1) * dailyIncrease)

    // Cap at the account's warmupDailyLimit
    return Math.min(calculatedLimit, maxLimit)
}

export async function sendWarmupEmails(guard?: { isTimedOut: () => boolean, elapsedSec: () => number }) {
    // Get all accounts with warmup enabled
    const accounts = await prisma.emailAccount.findMany({
        where: {
            warmupEnabled: true,
            status: 'active'
        }
    })

    console.log(`Sending warmup emails for ${accounts.length} accounts`)

    if (accounts.length < 2) {
        console.log('Skipping warmup: At least 2 active warmup accounts are required for internal exchange.')
        return
    }

    for (const account of accounts) {
        if (guard?.isTimedOut()) {
            console.warn(`[Warmup] Approaching timeout (${guard.elapsedSec()}s). Stopping warmup sends early.`)
            break
        }

        try {
            // Re-fetch account to get latest state and prevent race conditions
            const freshAccount = await prisma.emailAccount.findUnique({
                where: { id: account.id }
            })

            if (!freshAccount) {
                console.log(`Account ${account.id} not found, skipping`)
                continue
            }

            const warmupLimit = calculateWarmupLimit(freshAccount)
            const alreadySent = freshAccount.warmupSentToday || 0

            if (alreadySent >= warmupLimit) {
                console.log(`${freshAccount.email}: Warmup limit reached (${alreadySent}/${warmupLimit})`)
                continue
            }

            // Check if we've sent emails recently (within last 30 minutes) to prevent duplicates
            // when user pauses/starts warmup or cron runs multiple times
            const lastSent = freshAccount.lastWarmupSentAt
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

            if (lastSent && lastSent > thirtyMinutesAgo) {
                console.log(`${freshAccount.email}: Skipping - already sent at ${lastSent.toISOString()}`)
                continue
            }

            // Send warmup emails to other accounts in the system
            const otherAccounts = await prisma.emailAccount.findMany({
                where: {
                    id: { not: account.id },
                    warmupEnabled: true
                },
                take: warmupLimit - alreadySent
            })

            let sentCount = 0
            for (const recipient of otherAccounts) {
                if (guard?.isTimedOut()) {
                    console.warn(`[Warmup] Timeout in recipient loop (${guard.elapsedSec()}s). Breaking.`)
                    break
                }

                await sendWarmupEmail(freshAccount, recipient)
                sentCount++

                // Update warmup sent count and timestamp
                await prisma.emailAccount.update({
                    where: { id: freshAccount.id },
                    data: {
                        warmupSentToday: { increment: 1 },
                        lastWarmupSentAt: new Date()
                    }
                })
            }

            // Update health score once per account (not per email) to save DB round trips
            if (sentCount > 0) {
                await calculateAndUpdateHealthScore(freshAccount.id)
            }

            console.log(`${account.email}: Sent ${sentCount} warmup emails`)
        } catch (error) {
            console.error(`Warmup failed for ${account.email}:`, error)
        }
    }
}

async function sendWarmupEmail(from: any, to: any) {
    const warmupTopics = [
        {
            subject: 'Quick question regarding next week\'s agenda',
            body: `Hi ${to.firstName || 'there'},\n\nHope you are having a productive week. Just wanted to quickly verify if we are still on track for the deliverables we discussed earlier?\n\nLet me know if you need any additional context from our end.\n\nBest regards,\n${from.firstName || 'Team'}`
        },
        {
            subject: 'Following up on the project notes',
            body: `Hey ${to.firstName || 'there'},\n\nSharing a quick update regarding the timeline. Everything looks solid on our side so far. Let\'s sync up briefly when you have a free moment.\n\nCheers,\n${from.firstName || 'Team'}`
        },
        {
            subject: 'Feedback on the quarterly overview deck',
            body: `Hello ${to.firstName || 'there'},\n\nI reviewed the summary draft you shared. The numbers look promising and the direction is spot on. I added a couple of minor comments in the margin.\n\nTalk soon,\n${from.firstName || 'Team'}`
        },
        {
            subject: 'Touching base on the recent updates',
            body: `Hi ${to.firstName || 'there'},\n\nJust touching base to see how things are progressing on your side. Let me know if there is anything I can assist with this week.\n\nThanks,\n${from.firstName || 'Team'}`
        },
        {
            subject: 'Resource sharing & quick follow up',
            body: `Hey ${to.firstName || 'there'},\n\nCame across an insightful case study earlier today that reminded me of our conversation. Wanted to pass it along in case it proves useful.\n\nHave a great rest of your day,\n${from.firstName || 'Team'}`
        },
        {
            subject: 'Schedule check for Thursday afternoon',
            body: `Hi ${to.firstName || 'there'},\n\nWould you have 10 minutes open this Thursday around 2 PM to run through the finalized plan?\n\nBest,\n${from.firstName || 'Team'}`
        }
    ]

    const selected = warmupTopics[Math.floor(Math.random() * warmupTopics.length)]
    const warmupUniqueId = `warmup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    await sendEmail({
        config: {
            host: from.smtpHost || 'smtp.gmail.com',
            port: from.smtpPort || 587,
            user: from.smtpUser || from.email,
            pass: from.smtpPass || ''
        },
        to: to.email,
        subject: selected.subject,
        html: selected.body.replace(/\n/g, '<br>'),
        fromName: `${from.firstName || ''} ${from.lastName || ''}`.trim() || from.email,
        fromEmail: from.email
    })

    // Log the warmup send activity
    await logWarmupActivity(
        from.id,
        'send',
        `Sent positive warmup conversation (${selected.subject}) to ${to.email}`,
        to.email
    )
}

// Reset daily counters at midnight
export async function resetDailyCounters() {
    await prisma.emailAccount.updateMany({
        data: {
            sentToday: 0,
            warmupSentToday: 0
        }
    })
    console.log('Daily counters reset')
}
