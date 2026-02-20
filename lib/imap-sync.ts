import imaps, { MessageBodyPart } from 'imap-simple'
import { simpleParser, AddressObject } from 'mailparser'
import { prisma } from './prisma'
import { dispatchWebhook } from './webhooks'

interface EmailAccount {
    id: string
    email: string
    imapHost: string | null
    imapPort: number | null
    imapUser: string | null
    imapPass: string | null
    lastSyncedAt?: Date | null
}

const RETRY_ATTEMPTS = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s

const TRANSIENT_ERRORS = ['ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH', 'ECONNREFUSED', 'EAI_AGAIN']
const PERMANENT_ERRORS = ['EAUTH', 'ENOTFOUND', 'Authentication', 'invalid credentials', 'Invalid credentials']

function isTransientError(error: any): boolean {
    const errorStr = String(error?.message || error).toLowerCase()
    return TRANSIENT_ERRORS.some(e => errorStr.includes(e.toLowerCase())) || 
           error?.code === 'ECONNRESET' ||
           error?.code === 'ETIMEDOUT'
}

function isPermanentError(error: any): boolean {
    const errorStr = String(error?.message || error).toLowerCase()
    return PERMANENT_ERRORS.some(e => errorStr.includes(e.toLowerCase())) ||
           error?.code === 'EAUTH' ||
           error?.code === 'ENOTFOUND'
}

async function withRetry<T>(
    fn: () => Promise<T>,
    accountEmail: string,
    operationName: string
): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
        try {
            return await fn()
        } catch (error: any) {
            lastError = error
            
            if (isPermanentError(error)) {
                console.error(`[IMAP] Permanent error for ${accountEmail} (${operationName}): Invalid credentials or DNS issue -`, error.message || error)
                throw error
            }
            
            if (isTransientError(error)) {
                const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
                console.warn(`[IMAP] Transient error for ${accountEmail} (${operationName}), attempt ${attempt + 1}/${RETRY_ATTEMPTS}: ${error.message || error}. Retrying in ${delay}ms...`)
                
                if (attempt < RETRY_ATTEMPTS - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
            }
            
            // If we get here, it's an unknown error or we've exhausted retries
            console.error(`[IMAP] Error for ${accountEmail} (${operationName}) after ${attempt + 1} attempts:`, error.message || error)
            throw error
        }
    }
    
    throw lastError
}

function getAddressString(address: AddressObject | AddressObject[] | undefined): string {
    if (!address) return ''
    if (Array.isArray(address)) {
        return address.map(a => a.text).join(', ')
    }
    return address.text
}

export async function syncReplies(account: EmailAccount) {
    if (!account.imapHost || !account.imapPort || !account.imapUser || !account.imapPass) {
        console.log(`Skipping ${account.email}: Missing IMAP credentials`)
        return
    }

    return withRetry(async () => {
        const config = {
            imap: {
                user: account.imapUser!,
                password: account.imapPass!,
                host: account.imapHost!,
                port: account.imapPort!,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000,
                connectionTimeout: 30000
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
            const all = item.parts.find((part: MessageBodyPart) => part.which === '')
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
                                from: getAddressString(parsed.from),
                                to: getAddressString(parsed.to),
                                subject: parsed.subject,
                                date: parsed.date,
                                messageId: parsed.messageId
                            }),
                            details: parsed.text || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]*>?/gm, '') : "")
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
    }, account.email, 'syncReplies')
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
