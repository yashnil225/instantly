import { prisma } from './prisma'
import { syncReplies } from './imap-sync'

const BOUNCE_KEYWORDS = [
    'delivery failed',
    'undeliverable',
    'mail delivery failed',
    'returned mail',
    'delivery status notification',
    'permanent error',
    'user unknown',
    'mailbox unavailable',
    'address rejected'
]

export async function detectBounces(account: any) {
    // Use the same IMAP connection as reply detection
    // but look for bounce notifications

    try {
        // In a real implementation, we'd parse bounce emails
        // For now, this is a placeholder structure
        console.log(`Checking bounces for ${account.email}`)

        // Bounce detection logic would go here
        // Similar to reply detection but looking for:
        // 1. Emails from MAILER-DAEMON
        // 2. Subject containing bounce keywords
        // 3. Parse DSN (Delivery Status Notification) format

    } catch (error) {
        console.error(`Bounce detection failed for ${account.email}:`, error)
    }
}

export async function handleBounce(leadId: string, campaignId: string, bounceType: 'hard' | 'soft') {
    // Create bounce event
    await prisma.sendingEvent.create({
        data: {
            type: 'bounce',
            leadId,
            campaignId,
            metadata: JSON.stringify({ bounceType })
        }
    })

    // Update lead status
    await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'bounced' }
    })

    // Update campaign stats
    await prisma.campaign.update({
        where: { id: campaignId },
        data: { bounceCount: { increment: 1 } }
    })

    // Check account health
    const account = await prisma.emailAccount.findFirst({
        where: {
            campaignAccounts: {
                some: {
                    campaign: {
                        id: campaignId
                    }
                }
            }
        },
        include: {
            _count: {
                select: {
                    campaignAccounts: true
                }
            }
        }
    })

    if (account) {
        // Calculate bounce rate
        const sentEvents = await prisma.sendingEvent.count({
            where: {
                type: 'sent',
                metadata: {
                    contains: account.email
                }
            }
        })

        const bounceEvents = await prisma.sendingEvent.count({
            where: {
                type: 'bounce',
                metadata: {
                    contains: account.email
                }
            }
        })

        const bounceRate = sentEvents > 0 ? (bounceEvents / sentEvents) * 100 : 0

        // If bounce rate > 5%, pause account
        if (bounceRate > 5) {
            await prisma.emailAccount.update({
                where: { id: account.id },
                data: {
                    status: 'paused',
                    healthScore: Math.max(0, 100 - Math.floor(bounceRate * 2))
                }
            })
            console.log(`Account ${account.email} paused due to high bounce rate: ${bounceRate.toFixed(2)}%`)
        }
    }
}
