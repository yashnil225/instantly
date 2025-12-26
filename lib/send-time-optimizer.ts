import moment from 'moment-timezone'

export interface OptimalSendTime {
    hour: number // 0-23
    minute: number // 0-59
    timezone: string
    reason: string
}

/**
 * Calculate optimal send time based on timezone
 * 
 * Best practices:
 * - B2B: Tuesday-Thursday, 10 AM - 2 PM local time
 * - Avoid Mondays (inbox overload) and Fridays (weekend mode)
 * - Avoid early morning (<8 AM) and late evening (>6 PM)
 */
export function calculateOptimalSendTime(timezone: string = 'UTC'): OptimalSendTime {
    const now = moment().tz(timezone)
    const dayOfWeek = now.day() // 0 = Sunday, 6 = Saturday
    const hour = now.hour()

    // If it's weekend, schedule for next Tuesday 10 AM
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        const nextTuesday = now.clone().day(2).hour(10).minute(0)
        if (nextTuesday.isBefore(now)) {
            nextTuesday.add(1, 'week')
        }
        return {
            hour: 10,
            minute: 0,
            timezone,
            reason: 'Scheduled for Tuesday morning (avoiding weekend)'
        }
    }

    // If it's Monday, schedule for Tuesday
    if (dayOfWeek === 1) {
        return {
            hour: 10,
            minute: 0,
            timezone,
            reason: 'Scheduled for Tuesday (avoiding Monday inbox overload)'
        }
    }

    // If it's Friday after 2 PM, schedule for next Tuesday
    if (dayOfWeek === 5 && hour >= 14) {
        return {
            hour: 10,
            minute: 0,
            timezone,
            reason: 'Scheduled for next Tuesday (avoiding Friday afternoon)'
        }
    }

    // If current time is outside business hours (8 AM - 6 PM)
    if (hour < 8) {
        return {
            hour: 10,
            minute: 0,
            timezone,
            reason: 'Scheduled for 10 AM (current time too early)'
        }
    }

    if (hour >= 18) {
        // Schedule for next day 10 AM
        return {
            hour: 10,
            minute: 0,
            timezone,
            reason: 'Scheduled for tomorrow 10 AM (current time too late)'
        }
    }

    // Current time is good (Tuesday-Thursday, 8 AM - 6 PM)
    return {
        hour: hour,
        minute: now.minute(),
        timezone,
        reason: 'Sending now (optimal time window)'
    }
}

/**
 * Get next optimal send time as Date object
 */
export function getNextOptimalSendTime(timezone: string = 'UTC'): Date {
    const optimal = calculateOptimalSendTime(timezone)
    const now = moment().tz(timezone)

    let sendTime = now.clone().hour(optimal.hour).minute(optimal.minute).second(0)

    // If calculated time is in the past, move to next day
    if (sendTime.isBefore(now)) {
        sendTime.add(1, 'day')
    }

    return sendTime.toDate()
}

/**
 * Analyze historical send data to find best times (placeholder)
 * 
 * In production, analyze:
 * - Open rates by send time
 * - Reply rates by send time
 * - Timezone-specific patterns
 */
export async function analyzeHistoricalSendTimes(campaignId: string): Promise<{
    bestHour: number
    bestDay: number
    openRate: number
}> {
    // Placeholder - would query SendingEvent table
    // and calculate statistics

    return {
        bestHour: 10, // 10 AM
        bestDay: 2, // Tuesday
        openRate: 0.25 // 25%
    }
}
