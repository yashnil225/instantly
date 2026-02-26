import Imap from 'node-imap'
import { simpleParser, Source } from 'mailparser'
import { prisma } from '@/lib/prisma'
import type { EmailAccount } from '@prisma/client'

const RETRY_ATTEMPTS = 3
const RETRY_DELAYS = [2000, 4000, 8000] // More conservative backoff: 2s, 4s, 8s

const TRANSIENT_ERRORS = ['ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH', 'ECONNREFUSED', 'EAI_AGAIN', 'socket hang up', 'read ECONNRESET']
const PERMANENT_ERRORS = ['EAUTH', 'ENOTFOUND', 'Authentication', 'invalid credentials', 'Invalid credentials', 'BadCredentials', 'Username and Password not accepted']

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

/**
 * Helper to ensure IMAP connection is fully closed
 */
const endImap = (imapConnection: Imap) => {
    return new Promise<void>((resolve) => {
        if (!imapConnection || (imapConnection as any).state === 'disconnected') {
            resolve()
            return
        }

        const timeout = setTimeout(() => {
            imapConnection.destroy()
            resolve()
        }, 5000)

        imapConnection.once('end', () => {
            clearTimeout(timeout)
            resolve()
        })

        imapConnection.once('close', () => {
            clearTimeout(timeout)
            resolve()
        })

        try {
            imapConnection.end()
        } catch (e) {
            imapConnection.destroy()
            resolve()
        }
    })
}

async function withRetry<T>(
    fn: (attempt: number) => Promise<T>,
    accountEmail: string,
    operationName: string
): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
        try {
            return await fn(attempt)
        } catch (error: any) {
            lastError = error

            if (isPermanentError(error)) {
                // Only log error for permanent failures
                console.error(`[IMAP] Permanent error for ${accountEmail} (${operationName}):`, error.message || error)
                throw error
            }

            if (isTransientError(error)) {
                const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
                // Log as warning for retries, not error
                console.warn(`[IMAP] Connection blip for ${accountEmail} (${operationName}), retry ${attempt + 1}/${RETRY_ATTEMPTS} in ${delay}ms...`)

                if (attempt < RETRY_ATTEMPTS - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
            }

            console.error(`[IMAP] ${operationName} failed for ${accountEmail} after ${attempt + 1} attempts:`, error.message || error)
            throw error
        }
    }

    throw lastError
}

/**
 * Combined sync function for efficiency (one connection for both replies and bounces)
 */
export async function syncAccountInbox(
    account: EmailAccount,
    guard?: { isTimedOut: () => boolean, elapsedSec: () => number }
): Promise<{ replies: number, bounces: number, sentSynced: number }> {
    const inboxResult = await withRetry(async (attempt) => {
        if (attempt === 0) {
            // Small jitter
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000)))
        }

        return new Promise<{ replies: number, bounces: number }>((resolve, reject) => {
            const imap = new Imap({
                user: account.imapUser || account.email,
                password: account.imapPass || account.smtpPass || '',
                host: account.imapHost || 'imap.gmail.com',
                port: account.imapPort || 993,
                tls: true,
                tlsOptions: {
                    rejectUnauthorized: false,
                    minVersion: 'TLSv1.2'
                },
                connTimeout: 10000, // Reduced to 10s
                authTimeout: 10000, // Reduced to 10s
                keepalive: false
            })

            let repliesFound = 0
            let bouncesFound = 0
            let isResolved = false

            const safeReject = async (err: any) => {
                if (isResolved) return
                isResolved = true
                await endImap(imap)
                reject(err)
            }

            const safeResolve = async () => {
                if (isResolved) return
                isResolved = true
                await endImap(imap)
                resolve({ replies: repliesFound, bounces: bouncesFound })
            }

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err) => {
                    if (err) return safeReject(err)

                    // Scan last 7 days (not just UNSEEN) so historical replies/bounces are backfilled.
                    // markSeen: false ensures we never alter read-state in the inbox.
                    const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    const searchCriteria = [['SINCE', since7Days]]

                    imap.search(searchCriteria, (err, results) => {
                        if (err) return safeReject(err)

                        if (!results || results.length === 0) {
                            return safeResolve()
                        }

                        const fetch = imap.fetch(results, { bodies: '', markSeen: false })
                        let processedCount = 0

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                simpleParser(stream as unknown as Source, async (err, parsed) => {
                                    processedCount++
                                    if (err) {
                                        if (processedCount === results.length) safeResolve()
                                        return
                                    }

                                    try {
                                        const from = parsed.from?.value[0]?.address?.toLowerCase()
                                        const subject = parsed.subject?.toLowerCase() || ''
                                        const bodyText = parsed.text || ''

                                        // --- CHECK FOR BOUNCE ---
                                        const isBounceSource = from === 'mailer-daemon@googlemail.com' ||
                                            from === 'postmaster' ||
                                            from?.includes('mailer-daemon') ||
                                            from?.includes('postmaster') ||
                                            from?.includes('bounce') ||
                                            subject.includes('delivery status notification') ||
                                            subject.includes('undelivered') ||
                                            subject.includes('undeliverable') ||
                                            subject.includes('returned mail')

                                        if (isBounceSource) {
                                            const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
                                            const foundEmails = bodyText.match(emailRegex) || []

                                            for (const bouncedEmail of foundEmails) {
                                                const lead = await prisma.lead.findFirst({
                                                    where: { email: bouncedEmail, campaignId: { not: undefined } }
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
                                                            bouncesFound++
                                                            console.log(`⚠️ Bounce detected: ${bouncedEmail}`)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        // --- CHECK FOR REPLY ---
                                        else if (from) {
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
                                                    include: { lead: true }
                                                })
                                            }

                                            // 2. Fallback matching strictly by emailAccountId and Lead Email
                                            if (!matchedSentEvent) {
                                                matchedSentEvent = await prisma.sendingEvent.findFirst({
                                                    where: {
                                                        type: 'sent',
                                                        emailAccountId: account.id,
                                                        lead: { email: from }
                                                    },
                                                    orderBy: { createdAt: 'desc' },
                                                    include: { lead: true }
                                                })
                                            }

                                            if (matchedSentEvent && matchedSentEvent.lead) {
                                                const lead = matchedSentEvent.lead

                                                // Duplicate guard: skip if reply with this messageId already recorded
                                                const existingReply = parsed.messageId
                                                    ? await prisma.sendingEvent.findFirst({
                                                        where: {
                                                            leadId: lead.id,
                                                            type: 'reply',
                                                            metadata: { contains: parsed.messageId }
                                                        }
                                                    })
                                                    : null

                                                if (existingReply) {
                                                    console.log(`⚡ Reply already recorded (msgId: ${parsed.messageId}), skipping`)
                                                } else {
                                                    const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
                                                    await prisma.$transaction([
                                                        prisma.sendingEvent.create({
                                                            data: {
                                                                type: 'reply',
                                                                leadId: lead.id,
                                                                campaignId: matchedSentEvent.campaignId,
                                                                emailAccountId: account.id,
                                                                metadata: JSON.stringify({ subject: parsed.subject, from, messageId: parsed.messageId }),
                                                                details: (typeof parsed.html === 'string' && parsed.html.trim().length > 0) ? parsed.html : (parsed.textAsHtml || parsed.text || "")
                                                            }
                                                        }),
                                                        prisma.lead.update({ where: { id: lead.id }, data: { status: 'replied' } }),
                                                        prisma.campaign.update({ where: { id: matchedSentEvent.campaignId }, data: { replyCount: { increment: 1 } } }),
                                                        prisma.campaignStat.upsert({
                                                            where: {
                                                                campaignId_date: {
                                                                    campaignId: matchedSentEvent.campaignId,
                                                                    date: todayUTC
                                                                }
                                                            },
                                                            create: {
                                                                campaignId: matchedSentEvent.campaignId,
                                                                date: todayUTC,
                                                                replied: 1
                                                            },
                                                            update: {
                                                                replied: { increment: 1 }
                                                            }
                                                        })
                                                    ])
                                                    // Classify reply to power Positive Reply Rate metric
                                                    try {
                                                        const replyText = ((parsed.subject || '') + ' ' + (parsed.text || '')).toLowerCase()
                                                        let aiLabel: string
                                                        if (replyText.includes('out of office') || replyText.includes('away until') || replyText.includes('vacation') || replyText.includes('auto-reply') || replyText.includes('automatic reply')) {
                                                            aiLabel = 'out_of_office'
                                                        } else if (replyText.includes('meeting') || replyText.includes('calendar') || replyText.includes('schedule a call') || replyText.includes('book a call') || replyText.includes('let\'s connect')) {
                                                            aiLabel = 'meeting_booked'
                                                        } else if (replyText.includes('not interested') || replyText.includes('no thanks') || replyText.includes('remove me') || replyText.includes('unsubscribe') || replyText.includes('stop emailing')) {
                                                            aiLabel = 'not_interested'
                                                        } else if (replyText.includes('wrong person') || replyText.includes('not the right contact') || replyText.includes('wrong department')) {
                                                            aiLabel = 'wrong_person'
                                                        } else if (replyText.includes('interested') || replyText.includes('sounds good') || replyText.includes('tell me more') || replyText.includes('send over') || replyText.includes('love to learn') || replyText.includes('would like to')) {
                                                            aiLabel = 'interested'
                                                        } else {
                                                            aiLabel = 'interested' // default positive assumption
                                                        }
                                                        await prisma.lead.update({
                                                            where: { id: lead.id },
                                                            data: { aiLabel }
                                                        })
                                                        console.log(`🏷️ Classified reply from ${from} as: ${aiLabel}`)
                                                    } catch (classifyErr) {
                                                        console.error(`Failed to classify reply from ${from}:`, classifyErr)
                                                    }

                                                    repliesFound++
                                                    console.log(`✅ Reply detected from ${from}`)
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Processing error:', e)
                                    } finally {
                                        if (processedCount === results.length) safeResolve()
                                    }
                                })
                            })
                        })

                        fetch.once('error', (err) => safeReject(err))
                        fetch.once('end', () => {
                            if (results.length === 0) safeResolve()
                        })
                    })
                })
            })

            imap.once('error', (err) => safeReject(err))
            imap.connect()
        })
    }, account.email, 'syncAccountInbox')

    // Also scan SENT folder to capture user's manual replies to leads
    if (guard?.isTimedOut()) {
        console.warn(`[SENT] Skipping SENT sync for ${account.email} due to timeout guard (${guard.elapsedSec()}s)`)
        return { ...inboxResult, sentSynced: 0 }
    }

    const sentSynced = await syncSentFolder(account)

    return { ...inboxResult, sentSynced }
}

/**
 * Legacy support: Check inbox for replies to sent emails
 */
export async function checkForReplies(account: EmailAccount): Promise<number> {
    const result = await syncAccountInbox(account)
    return result.replies
}

/**
 * Legacy support: Check inbox for bounce messages
 */
export async function checkForBounces(account: EmailAccount): Promise<number> {
    const result = await syncAccountInbox(account)
    return result.bounces
}

/**
 * Scan the SENT folder and create sent events for emails sent to known leads.
 * This makes user's manual Gmail replies show up in the Unibox conversation thread.
 */
async function syncSentFolder(account: EmailAccount): Promise<number> {
    return withRetry(async (attempt) => {
        if (attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 500)))
        }

        return new Promise<number>((resolve, reject) => {
            const imap = new Imap({
                user: account.imapUser || account.email,
                password: account.imapPass || account.smtpPass || '',
                host: account.imapHost || 'imap.gmail.com',
                port: account.imapPort || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
                connTimeout: 10000,
                authTimeout: 10000,
                keepalive: false
            })

            let sentSynced = 0
            let isResolved = false

            const safeEnd = async (err?: Error) => {
                if (isResolved) return
                isResolved = true
                await endImap(imap)
                if (err) reject(err)
                else resolve(sentSynced)
            }

            imap.once('ready', () => {
                // Try common SENT folder names across Gmail, Outlook, generic IMAP
                const sentFolders = ['[Gmail]/Sent Mail', 'Sent Items', 'Sent', 'SENT', 'Sent Messages']
                let folderIndex = 0

                const tryNextFolder = () => {
                    if (folderIndex >= sentFolders.length) {
                        console.log(`[SENT] No sent folder found for ${account.email}`)
                        return safeEnd()
                    }
                    const folder = sentFolders[folderIndex++]
                    imap.openBox(folder, true, (err) => {
                        if (err) return tryNextFolder() // try next folder name
                        console.log(`[SENT] Scanning ${folder} for ${account.email}`)

                        const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        imap.search([['SINCE', since7Days]], (searchErr, results) => {
                            if (searchErr || !results || results.length === 0) return safeEnd()

                            const fetch = imap.fetch(results, { bodies: '', markSeen: false })
                            let processedCount = 0

                            fetch.on('message', (msg) => {
                                msg.on('body', (stream) => {
                                    simpleParser(stream as unknown as Source, async (parseErr, parsed) => {
                                        processedCount++
                                        if (!parseErr) {
                                            try {
                                                // Get all 'to' emails from the sent message
                                                // parsed.to is a single AddressObject; its .value is the array of addresses
                                                const toValue = Array.isArray(parsed.to) ? parsed.to : (parsed.to ? [parsed.to] : [])
                                                const toAddresses: string[] = toValue
                                                    .flatMap((addr: { value?: { address?: string }[] }) => addr.value || [])
                                                    .map((a: { address?: string }) => (a.address || '').toLowerCase())
                                                    .filter((a: string) => a.length > 0)

                                                for (const toEmail of toAddresses) {
                                                    // Only care about emails to known leads
                                                    const lead = await prisma.lead.findFirst({
                                                        where: { email: toEmail, campaignId: { not: undefined } }
                                                    })

                                                    if (lead) {
                                                        // Duplicate guard: skip if already tracked by messageId
                                                        const existing = parsed.messageId
                                                            ? await prisma.sendingEvent.findFirst({
                                                                where: { metadata: { contains: parsed.messageId } }
                                                            })
                                                            : null

                                                        if (!existing) {
                                                            await prisma.sendingEvent.create({
                                                                data: {
                                                                    type: 'sent',
                                                                    leadId: lead.id,
                                                                    campaignId: lead.campaignId!,
                                                                    emailAccountId: account.id,
                                                                    metadata: JSON.stringify({
                                                                        subject: parsed.subject,
                                                                        from: account.email,
                                                                        to: toEmail,
                                                                        messageId: parsed.messageId,
                                                                        isUserReply: true // distinguish from campaign-sent emails
                                                                    }),
                                                                    details: (typeof parsed.html === 'string' && parsed.html.trim().length > 0)
                                                                        ? parsed.html
                                                                        : (parsed.textAsHtml || parsed.text || '')
                                                                }
                                                            })
                                                            sentSynced++
                                                            console.log(`📤 User reply synced for lead ${toEmail}`)
                                                        }
                                                    }
                                                }
                                            } catch (e) {
                                                console.error('[SENT] Processing error:', e)
                                            }
                                        }
                                        if (processedCount === results.length) safeEnd()
                                    })
                                })
                            })

                            fetch.once('error', (err) => safeEnd(err))
                            fetch.once('end', () => {
                                if (results.length === 0) safeEnd()
                            })
                        })
                    })
                }

                tryNextFolder()
            })

            imap.once('error', (err: Error) => safeEnd(err))
            imap.connect()
        })
    }, account.email, 'syncSentFolder').catch(err => {
        console.error(`[SENT] Sync failed for ${account.email}:`, err)
        return 0 // non-fatal: don't break the main INBOX sync result
    })
}
