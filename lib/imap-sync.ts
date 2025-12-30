import imaps from 'imap-simple'
import { simpleParser } from 'mailparser'
import { PrismaClient } from '@prisma/client'
import { dispatchWebhook } from './webhooks'

const prisma = new PrismaClient()

interface EmailAccount {
    id: string
    email: string
    imapHost: string | null
    imapPort: number | null
    imapUser: string | null
    imapPass: string | null
    lastSyncedAt?: Date | null
}

export async function syncReplies(account: EmailAccount) {
    if (!account.imapHost || !account.imapPort || !account.imapUser || !account.imapPass) {
        console.log(`Skipping ${account.email}: Missing IMAP credentials`)
        return
    }

    const config = {
        imap: {
            user: account.imapUser,
            password: account.imapPass,
            host: account.imapHost,
            port: account.imapPort,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000
        }
    }

    try {
        console.log(`Syncing replies for ${account.email}...`)

        const connection = await imaps.connect(config)
        await connection.openBox('INBOX')

        // Search for unread emails since last sync
        const searchCriteria = ['UNSEEN']
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        }

        const messages = await connection.search(searchCriteria, fetchOptions)
        console.log(`Found ${messages.length} unread messages for ${account.email}`)

        for (const item of messages) {
            const all = item.parts.find((part: any) => part.which === '')
            if (!all) continue

            const parsed = await simpleParser(all.body)

            // Extract In-Reply-To or References header to match to sent email
            const inReplyTo = parsed.inReplyTo
            const references = parsed.references

            if (!inReplyTo && !references) {
                continue // Not a reply
            }

            // Find the original sent email by Message-ID
            const messageIds = [inReplyTo, ...(references || [])].filter(Boolean)

            for (const messageId of messageIds) {
                const sentEvent = await prisma.sendingEvent.findFirst({
                    where: {
                        type: 'sent',
                        metadata: {
                            contains: messageId
                        }
                    },
                    include: {
                        lead: true,
                        campaign: true
                    }
                })

                if (sentEvent) {
                    console.log(`Reply detected from ${parsed.from?.text} for lead ${sentEvent.lead.email}`)

                    // Create reply event
                    const replyEvent = await prisma.sendingEvent.create({
                        data: {
                            type: 'reply',
                            leadId: sentEvent.leadId,
                            campaignId: sentEvent.campaignId,
                            metadata: JSON.stringify({
                                from: parsed.from?.text,
                                subject: parsed.subject,
                                date: parsed.date,
                                messageId: parsed.messageId
                            })
                        }
                    })

                    // Update lead status
                    const updatedLead = await prisma.lead.update({
                        where: { id: sentEvent.leadId },
                        data: { status: 'replied' }
                    })

                    // Dispatch Webhook
                    if (sentEvent.campaign.userId) {
                        dispatchWebhook(sentEvent.campaign.userId, "lead.replied", {
                            lead: updatedLead,
                            campaign: sentEvent.campaign,
                            reply: JSON.parse(replyEvent.metadata!)
                        })
                    }

                    // Update campaign stats
                    await prisma.campaign.update({
                        where: { id: sentEvent.campaignId },
                        data: { replyCount: { increment: 1 } }
                    })

                    // If stopOnReply is enabled, we could pause the campaign for this lead
                    if (sentEvent.campaign.stopOnReply) {
                        // In a full implementation, we'd mark this lead as "do not contact"
                        console.log(`Campaign ${sentEvent.campaign.name} has stopOnReply enabled`)
                    }

                    break // Found the match, move to next message
                }
            }
        }

        // Update last synced timestamp
        await prisma.emailAccount.update({
            where: { id: account.id },
            data: { lastSyncedAt: new Date() }
        })

        connection.end()
        console.log(`Sync complete for ${account.email}`)
    } catch (error) {
        console.error(`IMAP sync failed for ${account.email}:`, error)
        throw error
    }
}

export async function syncAllAccounts() {
    const accounts = await prisma.emailAccount.findMany({
        where: {
            status: 'active',
            imapHost: { not: null }
        }
    })

    console.log(`Syncing ${accounts.length} accounts...`)

    for (const account of accounts) {
        try {
            await syncReplies(account)
        } catch (error) {
            console.error(`Failed to sync ${account.email}:`, error)
            // Continue with other accounts
        }
    }
}
