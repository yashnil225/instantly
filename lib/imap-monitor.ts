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
 * Check inbox for replies to sent emails
 */
export async function checkForReplies(account: EmailAccount): Promise<number> {
    return withRetry(async (attempt) => {
        // Add sequential delay to prevent concurrent connections from same IP
        if (attempt === 0) {
            const jitter = Math.floor(Math.random() * 2000)
            await new Promise(resolve => setTimeout(resolve, jitter))
        }

        return new Promise<number>((resolve, reject) => {
            const imap = new Imap({
                user: account.imapUser || account.email,
                password: account.imapPass || account.smtpPass || '',
                host: account.imapHost || 'imap.gmail.com',
                port: account.imapPort || 993,
                tls: true,
                tlsOptions: { 
                    rejectUnauthorized: false,
                    minVersion: 'TLSv1.2' // Enforce stable TLS
                },
                connTimeout: 15000,
                authTimeout: 15000,
                keepalive: false // Don't keep alive for cron jobs
            })

            let repliesFound = 0
            let isResolved = false

            const safeReject = async (err: any) => {
                if (isResolved) return
                isResolved = true
                await endImap(imap)
                reject(err)
            }

            const safeResolve = async (val: number) => {
                if (isResolved) return
                isResolved = true
                await endImap(imap)
                resolve(val)
            }

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err) => {
                    if (err) return safeReject(err)

                    const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]]

                    imap.search(searchCriteria, (err, results) => {
                        if (err) return safeReject(err)

                        if (!results || results.length === 0) {
                            return safeResolve(0)
                        }

                        const fetch = imap.fetch(results, { bodies: '', markSeen: false })

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                simpleParser(stream as unknown as Source, async (err, parsed) => {
                                    if (err) return

                                    try {
                                        const from = parsed.from?.value[0]?.address
                                        if (!from) return

                                        const lead = await prisma.lead.findFirst({
                                            where: { email: from }
                                        })

                                        if (!lead) return

                                        const sentEvent = await prisma.sendingEvent.findFirst({
                                            where: {
                                                leadId: lead.id,
                                                type: 'sent',
                                                emailAccountId: account.id
                                            },
                                            orderBy: { createdAt: 'desc' }
                                        })

                                        if (!sentEvent) return

                                        await prisma.$transaction([
                                            prisma.sendingEvent.create({
                                                data: {
                                                    type: 'reply',
                                                    leadId: lead.id,
                                                    campaignId: sentEvent.campaignId,
                                                    emailAccountId: account.id,
                                                    metadata: JSON.stringify({
                                                        subject: parsed.subject,
                                                        from: from,
                                                        date: parsed.date
                                                    })
                                                }
                                            }),
                                            prisma.lead.update({
                                                where: { id: lead.id },
                                                data: { status: 'replied' }
                                            }),
                                            prisma.campaign.update({
                                                where: { id: sentEvent.campaignId },
                                                data: { replyCount: { increment: 1 } }
                                            })
                                        ])

                                        repliesFound++
                                        console.log(`✅ Reply detected from ${from} to ${account.email}`)
                                    } catch (error) {
                                        console.error('Error processing reply:', error)
                                    }
                                })
                            })
                        })

                        fetch.once('error', (err) => safeReject(err))
                        fetch.once('end', () => safeResolve(repliesFound))
                    })
                })
            })

            imap.once('error', (err) => safeReject(err))
            imap.connect()
        })
    }, account.email, 'checkForReplies')
}

/**
 * Check inbox for bounce messages
 */
export async function checkForBounces(account: EmailAccount): Promise<number> {
    return withRetry(async (attempt) => {
        // Add sequential delay
        if (attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        return new Promise<number>((resolve, reject) => {
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
                connTimeout: 15000,
                authTimeout: 15000,
                keepalive: false
            })

            let bouncesFound = 0
            let isResolved = false

            const safeReject = async (err: any) => {
                if (isResolved) return
                isResolved = true
                await endImap(imap)
                reject(err)
            }

            const safeResolve = async (val: number) => {
                if (isResolved) return
                isResolved = true
                await endImap(imap)
                resolve(val)
            }

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err) => {
                    if (err) return safeReject(err)

                    const searchCriteria = [
                        'UNSEEN',
                        ['OR', ['FROM', 'mailer-daemon'], ['FROM', 'postmaster']],
                        ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
                    ]

                    imap.search(searchCriteria, (err, results) => {
                        if (err) return safeReject(err)

                        if (!results || results.length === 0) {
                            return safeResolve(0)
                        }

                        const fetch = imap.fetch(results, { bodies: '', markSeen: false })

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                simpleParser(stream as unknown as Source, async (err, parsed) => {
                                    if (err) return

                                    try {
                                        const bodyText = parsed.text || ''
                                        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
                                        const emails = bodyText.match(emailRegex) || []

                                        for (const email of emails) {
                                            const lead = await prisma.lead.findFirst({
                                                where: { email: email }
                                            })

                                            if (!lead) continue

                                            const sentEvent = await prisma.sendingEvent.findFirst({
                                                where: {
                                                    leadId: lead.id,
                                                    type: 'sent',
                                                    emailAccountId: account.id
                                                },
                                                orderBy: { createdAt: 'desc' }
                                            })

                                            if (!sentEvent) continue

                                            await prisma.$transaction([
                                                prisma.sendingEvent.create({
                                                    data: {
                                                        type: 'bounce',
                                                        leadId: lead.id,
                                                        campaignId: sentEvent.campaignId,
                                                        emailAccountId: account.id,
                                                        metadata: JSON.stringify({
                                                            subject: parsed.subject,
                                                            bounceReason: bodyText.substring(0, 500)
                                                        })
                                                    }
                                                }),
                                                prisma.lead.update({
                                                    where: { id: lead.id },
                                                    data: { status: 'bounced' }
                                                }),
                                                prisma.campaign.update({
                                                    where: { id: sentEvent.campaignId },
                                                    data: { bounceCount: { increment: 1 } }
                                                })
                                            ])

                                            bouncesFound++
                                            console.log(`⚠️ Bounce detected for ${email} via ${account.email}`)
                                        }
                                    } catch (error) {
                                        console.error('Error processing bounce:', error)
                                    }
                                })
                            })
                        })

                        fetch.once('error', (err) => safeReject(err))
                        fetch.once('end', () => safeResolve(bouncesFound))
                    })
                })
            })

            imap.once('error', (err) => safeReject(err))
            imap.connect()
        })
    }, account.email, 'checkForBounces')
}
