// Limit calculation utilities for campaign sending capacity

export interface EmailAccount {
    id: string
    status: string
    dailyLimit: number
    sentToday: number
    createdAt: Date | string
    slowRamp?: boolean
    warmupEnabled: boolean
    warmupCurrentDay: number
    warmupDailyIncrease: number
    warmupMaxPerDay: number
}

/**
 * Calculate total daily sending capacity across all active accounts
 */
export function calculateDailyCapacity(accounts: EmailAccount[]): number {
    return accounts
        .filter(acc => acc.status === 'active')
        .reduce((sum, acc) => {
            if (acc.warmupEnabled) {
                // Use warmup limits
                const warmupLimit = Math.min(
                    acc.warmupCurrentDay * acc.warmupDailyIncrease,
                    acc.warmupMaxPerDay
                )
                return sum + Math.max(0, warmupLimit - acc.sentToday)
            }
            
            // Check Campaign Slow Ramp
            let currentLimit = acc.dailyLimit
            if (acc.slowRamp) {
                const createdAt = typeof acc.createdAt === 'string' ? new Date(acc.createdAt) : acc.createdAt
                const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
                // Start at 20, increase by 20 each day
                const rampedLimit = 20 + (daysSinceCreated * 20)
                currentLimit = Math.min(rampedLimit, acc.dailyLimit)
            }

            // Use regular daily limit or ramped limit
            return sum + Math.max(0, currentLimit - acc.sentToday)
        }, 0)
}

export interface LimitValidation {
    withinLimits: boolean
    dailyCapacity: number
    daysNeeded: number
    warningMessage: string | null
    accountsAvailable: number
    totalLeads: number
}

/**
 * Calculate how many days needed to send all emails
 */
export function calculateDaysNeeded(totalLeads: number, dailyCapacity: number): number {
    if (dailyCapacity === 0) return Infinity
    return Math.ceil(totalLeads / dailyCapacity)
}

/**
 * Validate if campaign is within sending limits
 */
export function validateCampaignLimits(
    totalLeads: number,
    accounts: EmailAccount[],
    campaignDailyLimit?: number
): LimitValidation {
    const activeAccounts = accounts.filter(acc => acc.status?.toLowerCase() === 'active')
    
    // Primary fix: Use the synced campaign daily limit directly if available
    // The user ensures campaign limit is within total account capacity
    const effectiveLimit = campaignDailyLimit || calculateDailyCapacity(activeAccounts)

    const daysNeeded = calculateDaysNeeded(totalLeads, effectiveLimit)
    const withinLimits = totalLeads <= effectiveLimit

    let warningMessage = null
    if (!withinLimits && effectiveLimit > 0) {
        warningMessage = `This campaign will take approximately ${daysNeeded} days to complete. The system will automatically spread ${totalLeads} emails across multiple days, sending up to ${effectiveLimit} emails per day.`
    } else if (effectiveLimit === 0) {
        warningMessage = `No active email accounts available. Please connect and activate at least one email account.`
    }

    return {
        withinLimits,
        dailyCapacity: effectiveLimit,
        daysNeeded,
        warningMessage,
        accountsAvailable: activeAccounts.length,
        totalLeads
    }
}

/**
 * Get user-friendly warning message
 */
export function getWarningMessage(validation: LimitValidation): string {
    if (validation.accountsAvailable === 0) {
        return 'No email accounts available. Please connect at least one account to send emails.'
    }

    if (validation.daysNeeded === 1) {
        return `Ready to send ${validation.totalLeads} emails today (within your ${validation.dailyCapacity} daily limit).`
    }

    return `This campaign will take approximately ${validation.daysNeeded} days to complete. The system will automatically spread ${validation.totalLeads} emails across multiple days, sending up to ${validation.dailyCapacity} emails per day.`
}

/**
 * Format capacity info for display
 */
export function formatCapacityInfo(validation: LimitValidation) {
    return {
        totalLeads: validation.totalLeads.toLocaleString(),
        dailyCapacity: validation.dailyCapacity.toLocaleString(),
        daysNeeded: validation.daysNeeded,
        accountsAvailable: validation.accountsAvailable,
        status: validation.withinLimits ? 'success' : 'warning'
    }
}
