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
export async function syncAccountInbox(account: EmailAccount): Promise<{ replies: number, bounces: number }> {
    return withRetry(async (attempt) => {
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

                    // 1. Search for EVERYTHING (unseen in last 7 days)
                    const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]]

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
                                            const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')

                                            await prisma.$transaction([
                                                prisma.sendingEvent.create({
                                                    data: {
                                                        type: 'reply',
                                                        leadId: lead.id,
                                                        campaignId: matchedSentEvent.campaignId,
                                                        emailAccountId: account.id,
                                                        metadata: JSON.stringify({ subject: parsed.subject, from }),
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
                                            repliesFound++
                                            console.log(`✅ Reply detected from ${from}`)
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
