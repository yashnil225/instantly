import { prisma } from '@/lib/prisma'

export interface LeadMemoryRecord {
    email: string
    campaignId: string
    status: string
    stepReached: number
    lastContactedAt: Date
}

/**
 * Records or updates the persistent contact state for a lead in a campaign.
 * This memory persists even if the user deletes leads from the campaign.
 */
export async function recordLeadMemory(params: {
    campaignId: string
    email: string
    status: string
    stepReached?: number
    workspaceId?: string
    metadata?: any
}) {
    const { campaignId, email, status, stepReached = 1, workspaceId, metadata } = params
    const normalizedEmail = email.toLowerCase().trim()

    // We only persist contacted/reached states (not new/uncontacted)
    const PERSISTENT_STATUSES = ['contacted', 'replied', 'bounced', 'unsubscribed', 'sequence_complete', 'lead']
    if (!PERSISTENT_STATUSES.includes(status)) {
        return
    }

    try {
        await prisma.leadStatusMemory.upsert({
            where: {
                email_campaignId: {
                    email: normalizedEmail,
                    campaignId
                }
            },
            update: {
                status,
                stepReached,
                lastContactedAt: new Date(),
                workspaceId: workspaceId || undefined,
                metadata: metadata ? JSON.stringify(metadata) : undefined
            },
            create: {
                email: normalizedEmail,
                campaignId,
                status,
                stepReached,
                workspaceId,
                lastContactedAt: new Date(),
                metadata: metadata ? JSON.stringify(metadata) : undefined
            }
        })
    } catch (e) {
        console.error(`[LeadMemory] Failed to record memory for ${normalizedEmail} in ${campaignId}:`, e)
    }
}

/**
 * Returns a map of normalized emails to their historical persistent status for a campaign.
 */
export async function getLeadMemoryMap(campaignId: string, emails: string[]): Promise<Map<string, { status: string; stepReached: number }>> {
    const normalizedEmails = Array.from(new Set(emails.map(e => e.toLowerCase().trim())))
    if (normalizedEmails.length === 0) return new Map()

    const map = new Map<string, { status: string; stepReached: number }>()

    try {
        const records = await prisma.leadStatusMemory.findMany({
            where: {
                campaignId,
                email: { in: normalizedEmails }
            },
            select: {
                email: true,
                status: true,
                stepReached: true
            }
        })

        for (const r of records) {
            map.set(r.email.toLowerCase(), {
                status: r.status,
                stepReached: r.stepReached
            })
        }
    } catch (e) {
        console.error(`[LeadMemory] Failed to retrieve memory for campaign ${campaignId}:`, e)
    }

    return map
}
