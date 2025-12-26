import moment from 'moment-timezone'

interface Schedule {
    startTime: string | null // "09:00"
    endTime: string | null   // "17:00"
    timezone: string | null  // "America/New_York"
    days: string | null      // "Mon,Tue,Wed,Thu,Fri"
}

export function isCampaignScheduled(schedule: Schedule): boolean {
    const { startTime, endTime, timezone, days } = schedule

    if (!startTime || !endTime || !timezone || !days) {
        return true
    }

    const now = moment().tz(timezone)
    const currentDay = now.format('ddd')
    const currentTime = now.format('HH:mm')

    if (!days.includes(currentDay)) {
        return false
    }

    if (currentTime < startTime || currentTime > endTime) {
        return false
    }

    return true
}

// Alias for backward compatibility with worker.ts
export function canSendNow(schedule: Schedule): boolean {
    return isCampaignScheduled(schedule)
}

// Get next available send time
export function getNextSendTime(schedule: Schedule): Date {
    const { startTime, timezone, days } = schedule

    if (!startTime || !timezone || !days) {
        return new Date() // If no schedule, send now
    }

    const tz = timezone || 'UTC'
    const now = moment().tz(tz)

    // Find next valid day
    const daysList = days.split(',')
    let nextDate = now.clone()

    for (let i = 0; i < 7; i++) {
        const dayName = nextDate.format('ddd')
        if (daysList.includes(dayName)) {
            // Check if we can still send today
            if (i === 0 && nextDate.format('HH:mm') < startTime) {
                // Today, but before start time
                const [hours, minutes] = startTime.split(':').map(Number)
                nextDate.set({ hour: hours, minute: minutes, second: 0 })
                return nextDate.toDate()
            } else if (i > 0) {
                // Future day
                const [hours, minutes] = startTime.split(':').map(Number)
                nextDate.set({ hour: hours, minute: minutes, second: 0 })
                return nextDate.toDate()
            }
        }
        nextDate.add(1, 'day')
    }

    return now.toDate()
}
