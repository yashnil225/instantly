import imaps, { MessageBodyPart } from 'imap-simple'
import { simpleParser, AddressObject } from 'mailparser'
import { prisma } from './prisma'
import { dispatchWebhook } from './webhooks'
import { classifyEmailStatus } from './ai-service'

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

            // 1. Get List of Folders to find "Sent" folder
            const boxes = await connection.getBoxes()
            const boxNames = Object.keys(boxes)

            const sentFolderCandidates = ['sent', 'sent items', 'sent messages', '[gmail]/sent mail']
            const sentFolder = boxNames.find(name => sentFolderCandidates.includes(name.toLowerCase()))

            const foldersToSync = ['INBOX']
            if (sentFolder) foldersToSync.push(sentFolder)

            console.log(`Syncing folders: ${foldersToSync.join(', ')} for ${account.email}`)

            for (const folderName of foldersToSync) {
                await connection.openBox(folderName)
                const isSentFolder = folderName === sentFolder

                // Search last 60 days
                const since60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
                const searchCriteria = [['SINCE', since60Days]]
                const fetchOptions = {
                    bodies: ['HEADER', 'TEXT'],
                    markSeen: false
                }

                const messages = await connection.search(searchCriteria, fetchOptions)
                console.log(`[${folderName}] Found ${messages.length} messages for ${account.email}`)

                for (const item of messages) {
                    const all = item.parts.find((part: MessageBodyPart) => part.which === '')
                    if (!all) continue

                    const parsed = await simpleParser(all.body)

                    const from = parsed.from?.value[0]?.address?.toLowerCase() || getAddressString(parsed.from).toLowerCase()
                    const subject = parsed.subject?.toLowerCase() || ''
                    const bodyText = parsed.text || ''

                    // --- CHECK FOR BOUNCE ---
                    const isBounceSource =
                        from?.includes('mailer-daemon') ||
                        from?.includes('postmaster') ||
                        from?.includes('no-reply') ||
                        subject.includes('delivery status notification') ||
                        subject.includes('undelivered') ||
                        subject.includes('undeliverable') ||
                        subject.includes('returned mail') ||
                        subject.includes('delivery failure') ||
                        subject.includes('failure notice') ||
                        subject.includes('bounced') ||
                        subject.includes('not delivered') ||
                        subject.includes('could not be delivered') ||
                        subject.includes('delivery failed') ||
                        subject.includes('permanent failure') ||
                        subject.includes('address not found') ||
                        subject.includes('domain not found') ||
                        bodyText.includes('diagnostic-code') ||
                        bodyText.includes('final-recipient') ||
                        bodyText.includes('status: 5.')

                    if (isBounceSource) {
                        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
                        const searchContent = bodyText + ' ' + (parsed.html || '') + ' ' + (parsed.subject || '')
                        const foundEmails = Array.from(new Set(searchContent.match(emailRegex) || []))

                        for (const bouncedEmail of foundEmails) {
                            const lead = await prisma.lead.findFirst({
                                where: { email: bouncedEmail }
                            })

                            if (lead) {
                                const sentEvent = await prisma.sendingEvent.findFirst({
                                    where: { leadId: lead.id, type: 'sent', emailAccountId: account.id },
                                    orderBy: { createdAt: 'desc' }
                                })

                                if (sentEvent) {
                                    // Duplicate guard: skip if bounce already recorded for this lead
                                    const existingBounce = await prisma.sendingEvent.findFirst({
                                        where: { leadId: lead.id, type: 'bounce' }
                                    })
                                    if (existingBounce) {
                                        console.log(`⚡ Bounce already recorded for ${bouncedEmail}, skipping`)
                                    } else {
                                        const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
                                        await prisma.$transaction([
                                            prisma.sendingEvent.create({
                                                data: {
                                                    type: 'bounce',
                                                    leadId: lead.id,
                                                    campaignId: sentEvent.campaignId,
                                                    emailAccountId: account.id,
                                                    metadata: JSON.stringify({ subject: parsed.subject, reason: 'Detected via Inbox Sync' })
                                                }
                                            }),
                                            prisma.lead.update({ where: { id: lead.id }, data: { status: 'bounced' } }),
                                            prisma.campaign.update({ where: { id: sentEvent.campaignId }, data: { bounceCount: { increment: 1 } } }),
                                            prisma.campaignStat.upsert({
                                                where: { campaignId_date: { campaignId: sentEvent.campaignId, date: todayUTC } },
                                                create: { campaignId: sentEvent.campaignId, date: todayUTC, bounced: 1, sent: 0, opened: 0, clicked: 0, replied: 0 },
                                                update: { bounced: { increment: 1 } }
                                            })
                                        ])
                                        console.log(`⚠️ Bounce detected: ${bouncedEmail}`)
                                    }
                                }
                            }
                        }
                        continue
                    }

                    // --- CHECK FOR REPLY ---
                    let matchedSentEvent = null

                    // 1. Thread matching via In-Reply-To or References
                    let replyHeaders: string[] = []
                    if (parsed.inReplyTo) {
                        const inReplies = Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo : [parsed.inReplyTo]
                        replyHeaders.push(...inReplies)
                    }
                    if (parsed.references) {
                        const refs = Array.isArray(parsed.references) ? parsed.references : [parsed.references]
                        replyHeaders.push(...refs)
                    }

                    // Clean headers (remove < >)
                    replyHeaders = replyHeaders.map(h => h.replace(/[<>]/g, ''))

                    if (replyHeaders.length > 0) {
                        matchedSentEvent = await prisma.sendingEvent.findFirst({
                            where: {
                                messageId: { in: replyHeaders },
                                emailAccountId: account.id
                            },
                            include: { lead: true, campaign: true }
                        })
                    }

                    // 2. Fallback matching strictly by emailAccountId and Lead Email
                    if (!matchedSentEvent && from) {
                        matchedSentEvent = await prisma.sendingEvent.findFirst({
                            where: {
                                type: 'sent',
                                emailAccountId: account.id,
                                lead: { email: from }
                            },
                            orderBy: { createdAt: 'desc' },
                            include: { lead: true, campaign: true }
                        })
                    }

                    if (matchedSentEvent && matchedSentEvent.lead) {
                        const sentEvent = matchedSentEvent
                        console.log(`Reply detected from ${from} for lead ${sentEvent.lead.email}`)

                        // Duplicate guard: skip if we already have a reply event
                        // that matches this exact message ID (handles re-scanning old emails)
                        const existingReply = parsed.messageId
                            ? await prisma.sendingEvent.findFirst({
                                where: {
                                    leadId: sentEvent.leadId,
                                    type: 'reply',
                                    metadata: { contains: parsed.messageId }
                                }
                            })
                            : null

                        if (existingReply) {
                            console.log(`⚡ Reply already recorded (msgId: ${parsed.messageId}), skipping`)
                        } else {
                            // Create reply event
                            const replyEvent = await prisma.sendingEvent.create({
                                data: {
                                    type: 'reply',
                                    leadId: sentEvent.leadId,
                                    campaignId: sentEvent.campaignId,
                                    emailAccountId: account.id,
                                    metadata: JSON.stringify({
                                        from: getAddressString(parsed.from),
                                        to: getAddressString(parsed.to),
                                        subject: parsed.subject,
                                        date: parsed.date,
                                        messageId: parsed.messageId
                                    }),
                                    details: (typeof parsed.html === 'string' && parsed.html.trim().length > 0) ? parsed.html : (parsed.textAsHtml || parsed.text || "")
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
                                console.log(`Campaign ${sentEvent.campaign.name} has stopOnReply enabled`)
                            }

                            // --- NEW: AI CLASSIFICATION ---
                            if (!isSentFolder) {
                                try {
                                    const classification = await classifyEmailStatus(parsed.subject || '', parsed.text || '')
                                    await prisma.lead.update({
                                        where: { id: sentEvent.leadId },
                                        data: { aiLabel: classification }
                                    })
                                    console.log(`Classified reply from ${from} as: ${classification}`)
                                } catch (e) {
                                    console.error(`AI classification failed for ${from}:`, e)
                                }
                            }
                        }
                    }
                }
            }

            // Update last synced timestamp (once, after all messages processed)
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
    const { createTimeoutGuard } = await import('./timeout-guard')
    const guard = createTimeoutGuard(50_000) // 50s budget for Hobby plan (60s hard limit)

    const accounts = await prisma.emailAccount.findMany({
        where: {
            status: 'active',
            imapHost: { not: null }
        },
        orderBy: { lastSyncedAt: 'asc' },
        take: 10 // Increased to 10 for better throughput, guarded by timeoutGuard
    })

    console.log(`Syncing ${accounts.length} accounts...`)
    let synced = 0

    for (const account of accounts) {
        if (guard.isTimedOut()) {
            console.warn(`[Sync] Approaching Vercel timeout (${guard.elapsedSec()}s). Stopped after syncing ${synced}/${accounts.length} accounts.`)
            break
        }

        try {
            await syncReplies(account)
            synced++
        } catch (error) {
            console.error(`Failed to sync ${account.email}:`, error)
            // Continue with other accounts
        }
    }

    console.log(`[Sync] Completed ${synced}/${accounts.length} accounts in ${guard.elapsedSec()}s`)
}
