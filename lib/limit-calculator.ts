// Limit calculation utilities for campaign sending capacity

export interface EmailAccount {
    id: string
    status: string
    dailyLimit: number
    sentToday: number
    warmupEnabled: boolean
    warmupCurrentDay: number
    warmupDailyIncrease: number
    warmupMaxPerDay: number
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
            // Use regular daily limit
            return sum + Math.max(0, acc.dailyLimit - acc.sentToday)
        }, 0)
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
    const accountCapacity = calculateDailyCapacity(activeAccounts)

    // Effective limit is the minimum of account capacity and campaign limit
    const effectiveLimit = campaignDailyLimit
        ? Math.min(accountCapacity, campaignDailyLimit)
        : accountCapacity

    const daysNeeded = calculateDaysNeeded(totalLeads, effectiveLimit)
    const withinLimits = totalLeads <= effectiveLimit

    let warningMessage = null
    if (!withinLimits && effectiveLimit > 0) {
        warningMessage = `This campaign will take ${daysNeeded} days to complete. You have ${totalLeads} leads but can only send ${effectiveLimit} emails per day.`
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
