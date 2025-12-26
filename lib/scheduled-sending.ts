/**
 * Scheduled Sending System
 * Queue and manage scheduled email sends with timezone support
 */

import { prisma } from './prisma'

export interface ScheduledEmail {
    id: string
    campaignId: string
    leadId: string
    sequenceStepId: string
    scheduledAt: Date
    timezone: string
    status: "pending" | "sent" | "failed" | "cancelled"
    createdAt: Date
    sentAt?: Date
    error?: string
}

export interface ScheduleOptions {
    sendAt: Date
    timezone?: string
    respectBusinessHours?: boolean
    businessHoursStart?: number // 9 = 9 AM
    businessHoursEnd?: number // 17 = 5 PM
    excludeWeekends?: boolean
}

// Common timezones
export const TIMEZONES = [
    { value: "America/New_York", label: "Eastern Time (ET)", offset: "-05:00" },
    { value: "America/Chicago", label: "Central Time (CT)", offset: "-06:00" },
    { value: "America/Denver", label: "Mountain Time (MT)", offset: "-07:00" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "-08:00" },
    { value: "America/Anchorage", label: "Alaska Time", offset: "-09:00" },
    { value: "Pacific/Honolulu", label: "Hawaii Time", offset: "-10:00" },
    { value: "Europe/London", label: "London (GMT)", offset: "+00:00" },
    { value: "Europe/Paris", label: "Central European Time", offset: "+01:00" },
    { value: "Europe/Berlin", label: "Berlin Time", offset: "+01:00" },
    { value: "Asia/Dubai", label: "Dubai Time", offset: "+04:00" },
    { value: "Asia/Kolkata", label: "India Standard Time", offset: "+05:30" },
    { value: "Asia/Singapore", label: "Singapore Time", offset: "+08:00" },
    { value: "Asia/Tokyo", label: "Japan Time", offset: "+09:00" },
    { value: "Australia/Sydney", label: "Sydney Time", offset: "+11:00" },
    { value: "Pacific/Auckland", label: "New Zealand Time", offset: "+13:00" }
]

/**
 * Schedule an email for later sending
 */
export async function scheduleEmail(
    campaignId: string,
    leadId: string,
    sequenceStepId: string,
    options: ScheduleOptions
): Promise<ScheduledEmail> {
    const {
        sendAt,
        timezone = "UTC",
        respectBusinessHours = false,
        businessHoursStart = 9,
        businessHoursEnd = 17,
        excludeWeekends = false
    } = options

    let adjustedTime = new Date(sendAt)

    // Adjust for business hours if needed
    if (respectBusinessHours) {
        adjustedTime = adjustToBusinessHours(
            adjustedTime,
            timezone,
            businessHoursStart,
            businessHoursEnd,
            excludeWeekends
        )
    }

    const scheduled = await prisma.scheduledEmail.create({
        data: {
            campaignId,
            leadId,
            sequenceStepId,
            scheduledAt: adjustedTime,
            timezone,
            status: "pending"
        }
    })

    return {
        id: scheduled.id,
        campaignId: scheduled.campaignId,
        leadId: scheduled.leadId,
        sequenceStepId: scheduled.sequenceStepId,
        scheduledAt: scheduled.scheduledAt,
        timezone: scheduled.timezone,
        status: scheduled.status as any,
        createdAt: scheduled.createdAt
    }
}

/**
 * Get pending scheduled emails that are due
 */
export async function getDueEmails(limit: number = 100): Promise<ScheduledEmail[]> {
    const now = new Date()

    const emails = await prisma.scheduledEmail.findMany({
        where: {
            status: "pending",
            scheduledAt: { lte: now }
        },
        orderBy: { scheduledAt: "asc" },
        take: limit
    })

    return emails.map(e => ({
        id: e.id,
        campaignId: e.campaignId,
        leadId: e.leadId,
        sequenceStepId: e.sequenceStepId,
        scheduledAt: e.scheduledAt,
        timezone: e.timezone,
        status: e.status as any,
        createdAt: e.createdAt,
        sentAt: e.sentAt || undefined,
        error: e.error || undefined
    }))
}

/**
 * Mark email as sent
 */
export async function markEmailSent(id: string): Promise<void> {
    await prisma.scheduledEmail.update({
        where: { id },
        data: {
            status: "sent",
            sentAt: new Date()
        }
    })
}

/**
 * Mark email as failed
 */
export async function markEmailFailed(id: string, error: string): Promise<void> {
    await prisma.scheduledEmail.update({
        where: { id },
        data: {
            status: "failed",
            error
        }
    })
}

/**
 * Cancel a scheduled email
 */
export async function cancelScheduledEmail(id: string): Promise<void> {
    await prisma.scheduledEmail.update({
        where: { id },
        data: { status: "cancelled" }
    })
}

/**
 * Cancel all scheduled emails for a campaign
 */
export async function cancelCampaignEmails(campaignId: string): Promise<number> {
    const result = await prisma.scheduledEmail.updateMany({
        where: {
            campaignId,
            status: "pending"
        },
        data: { status: "cancelled" }
    })
    return result.count
}

/**
 * Reschedule a failed email
 */
export async function rescheduleEmail(id: string, newTime: Date): Promise<void> {
    await prisma.scheduledEmail.update({
        where: { id },
        data: {
            scheduledAt: newTime,
            status: "pending",
            error: null
        }
    })
}

/**
 * Adjust time to business hours
 */
function adjustToBusinessHours(
    date: Date,
    timezone: string,
    startHour: number,
    endHour: number,
    excludeWeekends: boolean
): Date {
    // Convert to timezone-aware date
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        weekday: "short"
    }

    const formatter = new Intl.DateTimeFormat("en-US", options)
    const parts = formatter.formatToParts(date)

    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "12")
    const weekday = parts.find(p => p.type === "weekday")?.value || "Mon"

    let adjusted = new Date(date)

    // Check if weekend
    if (excludeWeekends && (weekday === "Sat" || weekday === "Sun")) {
        // Move to next Monday
        const daysToAdd = weekday === "Sat" ? 2 : 1
        adjusted.setDate(adjusted.getDate() + daysToAdd)
        adjusted.setHours(startHour, 0, 0, 0)
    }

    // Check if before business hours
    if (hour < startHour) {
        adjusted.setHours(startHour, 0, 0, 0)
    }

    // Check if after business hours
    if (hour >= endHour) {
        adjusted.setDate(adjusted.getDate() + 1)
        adjusted.setHours(startHour, 0, 0, 0)

        // Skip weekend if needed
        if (excludeWeekends) {
            const newWeekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(adjusted)
            if (newWeekday === "Sat") {
                adjusted.setDate(adjusted.getDate() + 2)
            } else if (newWeekday === "Sun") {
                adjusted.setDate(adjusted.getDate() + 1)
            }
        }
    }

    return adjusted
}

/**
 * Get optimal send time based on engagement data
 */
export async function getOptimalSendTime(
    campaignId: string,
    timezone: string = "America/New_York"
): Promise<{ hour: number; day: string; confidence: number }> {
    // In a real implementation, this would analyze past engagement data
    // For now, return best practices defaults

    // Best times for B2B cold email:
    // Tuesday-Thursday, 9-11 AM recipient's time
    const bestTimes = [
        { hour: 10, day: "Tuesday", confidence: 85 },
        { hour: 9, day: "Wednesday", confidence: 82 },
        { hour: 11, day: "Thursday", confidence: 80 },
        { hour: 10, day: "Wednesday", confidence: 78 },
        { hour: 9, day: "Tuesday", confidence: 75 }
    ]

    // TODO: Analyze actual engagement data for this campaign
    // const engagementData = await prisma.sendingEvent.findMany({
    //     where: { campaignId },
    //     select: { sentAt: true, openedAt: true, repliedAt: true }
    // })

    return bestTimes[0]
}

/**
 * Get scheduled emails stats for a campaign
 */
export async function getScheduledStats(campaignId: string): Promise<{
    pending: number
    sent: number
    failed: number
    cancelled: number
    nextScheduled?: Date
}> {
    const stats = await prisma.scheduledEmail.groupBy({
        by: ["status"],
        where: { campaignId },
        _count: true
    })

    const nextEmail = await prisma.scheduledEmail.findFirst({
        where: { campaignId, status: "pending" },
        orderBy: { scheduledAt: "asc" },
        select: { scheduledAt: true }
    })

    const result = {
        pending: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        nextScheduled: nextEmail?.scheduledAt
    }

    for (const stat of stats) {
        if (stat.status in result) {
            (result as any)[stat.status] = stat._count
        }
    }

    return result
}
