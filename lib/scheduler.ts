import moment from 'moment-timezone'

interface Schedule {
    startTime: string | null // "09:00" or "9:00 AM"
    endTime: string | null   // "17:00" or "5:00 PM"
    timezone: string | null  // "America/New_York"
    days: string | null      // "Mon,Tue,Wed,Thu,Fri" or "mon,tue,wed,thu,fri"
}

// Convert 12-hour format (e.g., "1:30 PM") to 24-hour format (e.g., "13:30")
function to24Hour(time: string): string {
    if (!time) return "00:00"
    
    // Already in 24-hour format (e.g., "13:30")
    if (!time.includes('AM') && !time.includes('PM')) {
        return time
    }
    
    const isPM = time.toUpperCase().includes('PM')
    const isAM = time.toUpperCase().includes('AM')
    const timePart = time.replace(/\s*(AM|PM)\s*/i, '').trim()
    const [hourStr, minuteStr] = timePart.split(':')
    let hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr || '0', 10)
    
    if (isPM && hour !== 12) hour += 12
    if (isAM && hour === 12) hour = 0
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export function isCampaignScheduled(schedule: Schedule): boolean {
    const { startTime, endTime, timezone, days } = schedule

    if (!startTime || !endTime || !timezone || !days) {
        return true
    }

    const now = moment().tz(timezone)
    const currentDay = now.format('ddd').toLowerCase()
    const currentTime = now.format('HH:mm')

    // Normalize days to lowercase for comparison
    const daysLower = days.toLowerCase()
    if (!daysLower.includes(currentDay)) {
        return false
    }

    // Convert stored times to 24-hour format
    const start24 = to24Hour(startTime)
    const end24 = to24Hour(endTime)

    if (currentTime < start24 || currentTime > end24) {
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
