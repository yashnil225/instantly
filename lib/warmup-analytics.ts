/**
 * Warmup Analytics Dashboard Data
 * Provides data and utilities for the warmup analytics dashboard
 */

import { prisma } from './prisma'

export interface WarmupDashboardData {
    summary: WarmupSummary
    dailyStats: DailyWarmupStats[]
    accountStats: AccountWarmupStats[]
    poolStats: PoolStats
    healthBreakdown: HealthBreakdown
    recentActivity: WarmupActivity[]
}

export interface WarmupSummary {
    totalAccounts: number
    activeAccounts: number
    poolParticipants: number
    emailsSentToday: number
    emailsReceivedToday: number
    repliesSentToday: number
    spamRescuedToday: number
    averageHealthScore: number
}

export interface DailyWarmupStats {
    date: string
    sent: number
    received: number
    replies: number
    spamRescued: number
    healthScore: number
}

export interface AccountWarmupStats {
    id: string
    email: string
    healthScore: number
    warmupScore: number
    sentToday: number
    receivedToday: number
    repliedToday: number
    daysInWarmup: number
    status: "warming" | "warmed" | "paused" | "error"
    trend: "up" | "down" | "stable"
}

export interface PoolStats {
    totalParticipants: number
    totalEmailsExchanged: number
    averageScore: number
    topPerformers: { email: string; score: number }[]
    domainBreakdown: { domain: string; count: number }[]
}

export interface HealthBreakdown {
    factors: HealthFactor[]
    overallScore: number
    trend: number // Change from yesterday
    recommendations: string[]
}

export interface HealthFactor {
    name: string
    score: number
    weight: number
    description: string
    status: "good" | "warning" | "critical"
}

export interface WarmupActivity {
    id: string
    timestamp: Date
    action: string
    account: string
    details: string
    type: "send" | "receive" | "reply" | "spam_rescue" | "pool"
}

/**
 * Get complete warmup dashboard data
 */
export async function getWarmupDashboardData(): Promise<WarmupDashboardData> {
    const [summary, dailyStats, accountStats, poolStats, healthBreakdown, recentActivity] = await Promise.all([
        getWarmupSummary(),
        getDailyWarmupStats(7),
        getAccountWarmupStats(),
        getPoolStats(),
        getHealthBreakdown(),
        getRecentWarmupActivity(20)
    ])

    return {
        summary,
        dailyStats,
        accountStats,
        poolStats,
        healthBreakdown,
        recentActivity
    }
}

/**
 * Get warmup summary stats
 */
async function getWarmupSummary(): Promise<WarmupSummary> {
    const accounts = await prisma.emailAccount.findMany({
        where: { warmupEnabled: true }
    })

    const todayLogs = await prisma.warmupLog.findMany({
        where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
    })

    const activeAccounts = accounts.filter(a => a.status === "active").length
    const poolParticipants = accounts.filter(a => a.warmupPoolOptIn).length

    const sent = todayLogs.filter(l => l.action === "send" || l.action === "pool_send").length
    const replies = todayLogs.filter(l => l.action === "auto_reply").length
    const rescued = todayLogs.filter(l => l.action === "spam_rescue").length

    const avgHealth = accounts.length > 0
        ? Math.round(accounts.reduce((sum, a) => sum + (a.healthScore || 100), 0) / accounts.length)
        : 100

    return {
        totalAccounts: accounts.length,
        activeAccounts,
        poolParticipants,
        emailsSentToday: sent,
        emailsReceivedToday: sent, // Approximate
        repliesSentToday: replies,
        spamRescuedToday: rescued,
        averageHealthScore: avgHealth
    }
}

/**
 * Get daily warmup stats for the past N days
 */
async function getDailyWarmupStats(days: number): Promise<DailyWarmupStats[]> {
    const stats: DailyWarmupStats[] = []

    for (let i = days - 1; i >= 0; i--) {
        // Use UTC dates to match database timestamps and avoid timezone issues
        const now = new Date()
        const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - i))
        const nextDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - i + 1))

        const logs = await prisma.warmupLog.findMany({
            where: {
                createdAt: { gte: date, lt: nextDate }
            }
        })

        // Calculate average health score for this day from accounts that had activity
        const accountIdsWithActivity = [...new Set(logs.map(l => l.accountId))]
        let dayHealthScore = 100
        if (accountIdsWithActivity.length > 0) {
            const accountsWithActivity = await prisma.emailAccount.findMany({
                where: { id: { in: accountIdsWithActivity } },
                select: { healthScore: true }
            })
            dayHealthScore = Math.round(
                accountsWithActivity.reduce((sum, a) => sum + (a.healthScore || 100), 0) / accountsWithActivity.length
            )
        }

        stats.push({
            date: date.toISOString().split("T")[0],
            sent: logs.filter(l => l.action === "send" || l.action === "pool_send").length,
            received: logs.filter(l => l.action === "receive" || l.action === "pool_receive").length,
            replies: logs.filter(l => l.action === "auto_reply").length,
            spamRescued: logs.filter(l => l.action === "spam_rescue").length,
            healthScore: dayHealthScore
        })
    }

    return stats
}

/**
 * Get per-account warmup stats
 */
async function getAccountWarmupStats(): Promise<AccountWarmupStats[]> {
    const accounts = await prisma.emailAccount.findMany({
        where: { warmupEnabled: true },
        orderBy: { healthScore: "desc" }
    })

    return accounts.map(account => {
        const daysInWarmup = Math.floor(
            (Date.now() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )

        let status: "warming" | "warmed" | "paused" | "error" = "warming"
        if (account.status === "paused") status = "paused"
        else if (account.status === "error") status = "error"
        else if (daysInWarmup >= 14) status = "warmed"

        return {
            id: account.id,
            email: account.email,
            healthScore: account.healthScore || 100,
            warmupScore: account.warmupScore || 100,
            sentToday: account.warmupSentToday || 0,
            receivedToday: 0, // Would need to track this
            repliedToday: account.warmupRepliedToday || 0,
            daysInWarmup,
            status,
            trend: (account.healthScore || 100) >= 80 ? "up" : (account.healthScore || 100) >= 60 ? "stable" : "down"
        }
    })
}

/**
 * Get pool statistics
 */
async function getPoolStats(): Promise<PoolStats> {
    const poolAccounts = await prisma.emailAccount.findMany({
        where: { warmupPoolOptIn: true },
        orderBy: { warmupScore: "desc" }
    })

    const poolLogs = await prisma.warmupLog.findMany({
        where: {
            action: { in: ["pool_send", "pool_receive"] }
        }
    })

    // Domain breakdown
    const domainCounts: Record<string, number> = {}
    for (const account of poolAccounts) {
        const domain = account.email.split("@")[1]
        domainCounts[domain] = (domainCounts[domain] || 0) + 1
    }

    return {
        totalParticipants: poolAccounts.length,
        totalEmailsExchanged: poolLogs.length,
        averageScore: poolAccounts.length > 0
            ? Math.round(poolAccounts.reduce((sum, a) => sum + (a.warmupScore || 100), 0) / poolAccounts.length)
            : 100,
        topPerformers: poolAccounts.slice(0, 5).map(a => ({
            email: a.email,
            score: a.warmupScore || 100
        })),
        domainBreakdown: Object.entries(domainCounts)
            .map(([domain, count]) => ({ domain, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    }
}

/**
 * Get health score breakdown with factors
 */
async function getHealthBreakdown(): Promise<HealthBreakdown> {
    // Get warmup accounts and their logs for the past 14 days
    const accounts = await prisma.emailAccount.findMany({
        where: { warmupEnabled: true },
        include: {
            warmupLogs: {
                where: {
                    createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
                }
            }
        }
    })

    if (accounts.length === 0) {
        return {
            factors: [],
            overallScore: 100,
            trend: 0,
            recommendations: ["Enable warmup on your email accounts to improve deliverability"]
        }
    }

    // Calculate metrics from actual data
    const totalSent = accounts.reduce((sum, a) => 
        sum + a.warmupLogs.filter(l => l.action === "send" || l.action === "pool_send").length, 0
    )
    const totalReplies = accounts.reduce((sum, a) => 
        sum + a.warmupLogs.filter(l => l.action === "auto_reply").length, 0
    )
    const totalRescued = accounts.reduce((sum, a) => 
        sum + a.warmupLogs.filter(l => l.action === "spam_rescue").length, 0
    )
    const totalBounces = accounts.reduce((sum, a) => a.bounceCount || 0, 0)

    // Calculate average health score
    const avgHealthScore = Math.round(
        accounts.reduce((sum, a) => sum + (a.healthScore || 100), 0) / accounts.length
    )

    // Calculate reply rate
    const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0

    // Calculate spam rescue rate
    const spamRescueRate = totalSent > 0 ? Math.min(Math.round((totalRescued / totalSent) * 100), 100) : 0

    // Calculate sender reputation based on bounces and health scores
    const bounceRate = totalSent > 0 ? (totalBounces / totalSent) : 0
    const senderReputation = Math.max(0, Math.min(100, 100 - (bounceRate * 100)))

    // Calculate send volume consistency (check if sending daily)
    const last7Days = await prisma.warmupLog.groupBy({
        by: ['createdAt'],
        where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            action: { in: ['send', 'pool_send'] }
        },
        _count: { id: true }
    })
    const daysWithActivity = last7Days.length
    const sendVolumeScore = Math.round((daysWithActivity / 7) * 100)

    // Calculate factors
    const factors: HealthFactor[] = [
        {
            name: "Sender Reputation",
            score: Math.round(senderReputation),
            weight: 30,
            description: "Based on bounce rates and spam complaints",
            status: senderReputation >= 80 ? "good" : senderReputation >= 60 ? "warning" : "critical"
        },
        {
            name: "Engagement Rate",
            score: Math.round((replyRate + avgHealthScore) / 2),
            weight: 25,
            description: "Open and reply rates from warmup emails",
            status: replyRate >= 30 ? "good" : replyRate >= 15 ? "warning" : "critical"
        },
        {
            name: "Send Volume",
            score: sendVolumeScore,
            weight: 20,
            description: "Consistent daily sending patterns",
            status: sendVolumeScore >= 80 ? "good" : sendVolumeScore >= 50 ? "warning" : "critical"
        },
        {
            name: "Spam Rescue",
            score: Math.max(0, 100 - spamRescueRate * 2), // Lower is better for spam rescue need
            weight: 15,
            description: "Emails successfully rescued from spam",
            status: spamRescueRate < 5 ? "good" : spamRescueRate < 15 ? "warning" : "critical"
        },
        {
            name: "Reply Rate",
            score: replyRate,
            weight: 10,
            description: "Percentage of warmup emails replied to",
            status: replyRate >= 30 ? "good" : replyRate >= 15 ? "warning" : "critical"
        }
    ]

    const overallScore = Math.round(
        factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0)
    )

    // Calculate trend by comparing last 7 days to previous 7 days
    const now = new Date()
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const lastWeekLogs = await prisma.warmupLog.count({
        where: {
            createdAt: { gte: lastWeekStart },
            action: { in: ['send', 'pool_send', 'auto_reply'] }
        }
    })

    const previousWeekLogs = await prisma.warmupLog.count({
        where: {
            createdAt: { gte: previousWeekStart, lt: lastWeekStart },
            action: { in: ['send', 'pool_send', 'auto_reply'] }
        }
    })

    const trend = previousWeekLogs > 0 
        ? Math.round(((lastWeekLogs - previousWeekLogs) / previousWeekLogs) * 100)
        : 0

    // Generate recommendations based on actual data
    const recommendations: string[] = []
    if (replyRate < 20) {
        recommendations.push("Enable auto-reply to boost reply rates")
    }
    if (sendVolumeScore < 70) {
        recommendations.push("Ensure consistent daily warmup sending")
    }
    if (bounceRate > 0.05) {
        recommendations.push("High bounce rate detected - check email list quality")
    }
    if (avgHealthScore < 70) {
        recommendations.push("Some accounts have low health scores - review warmup settings")
    }
    if (recommendations.length === 0) {
        recommendations.push("Your warmup is performing well!")
    }

    return {
        factors,
        overallScore,
        trend,
        recommendations
    }
}

/**
 * Get recent warmup activity
 */
async function getRecentWarmupActivity(limit: number): Promise<WarmupActivity[]> {
    const logs = await prisma.warmupLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { account: { select: { email: true } } }
    })

    return logs.map(log => ({
        id: log.id,
        timestamp: log.createdAt,
        action: formatAction(log.action),
        account: log.account.email,
        details: log.details || "",
        type: log.action as any
    }))
}

function formatAction(action: string): string {
    const actions: Record<string, string> = {
        "send": "Sent warmup email",
        "receive": "Received warmup email",
        "auto_reply": "Auto-replied to warmup",
        "spam_rescue": "Rescued from spam",
        "pool_send": "Sent pool warmup",
        "pool_receive": "Received pool warmup"
    }
    return actions[action] || action
}
