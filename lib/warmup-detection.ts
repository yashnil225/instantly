import Imap from 'imap'
import { simpleParser, AddressObject } from 'mailparser'
import { prisma } from './prisma'

interface ImapConfig {
    host: string
    port: number
    user: string
    password: string
    tls: boolean
}

interface WarmupEmail {
    uid: number
    from: string
    to: string
    subject: string
    warmupId: string
    date: Date
    folder: string
}

function getAddressString(address: AddressObject | AddressObject[] | undefined): string {
    if (!address) return ''
    if (Array.isArray(address)) {
        return address.map(a => a.text).join(', ')
    }
    return address.text
}

const RETRY_ATTEMPTS = 3
const RETRY_DELAYS = [2000, 4000, 8000]

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
                console.error(`[Warmup-IMAP] Permanent error for ${accountEmail} (${operationName}):`, error.message || error)
                throw error
            }
            
            if (isTransientError(error)) {
                const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
                console.warn(`[Warmup-IMAP] Connection blip for ${accountEmail} (${operationName}), retry ${attempt + 1}/${RETRY_ATTEMPTS} in ${delay}ms...`)
                
                if (attempt < RETRY_ATTEMPTS - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
            }
            
            console.error(`[Warmup-IMAP] ${operationName} failed for ${accountEmail} after ${attempt + 1} attempts:`, error.message || error)
            throw error
        }
    }
    
    throw lastError
}

/**
 * Connect to IMAP and return the connection
 */
function connectImap(config: ImapConfig): Promise<Imap> {
    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: config.user,
            password: config.password,
            host: config.host,
            port: config.port,
            tls: config.tls,
            tlsOptions: { 
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            connTimeout: 15000,
            authTimeout: 15000
        })

        imap.once('ready', () => resolve(imap))
        imap.once('error', reject)
        imap.connect()
    })
}

/**
 * Search for warmup emails in a specific folder
 */
async function searchWarmupEmails(imap: Imap, folder: string): Promise<WarmupEmail[]> {
    return new Promise((resolve, reject) => {
        imap.openBox(folder, false, (err) => {
            if (err) {
                resolve([]) // Folder may not exist
                return
            }

            // Search for emails with our warmup header (last 24 hours)
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            imap.search([['SINCE', yesterday]], (err, results) => {
                if (err || !results.length) {
                    resolve([])
                    return
                }

                const warmupEmails: WarmupEmail[] = []
                const fetch = imap.fetch(results, { bodies: 'HEADER', struct: true })

                fetch.on('message', (msg) => {
                    let uid = 0
                    msg.once('attributes', (attrs) => {
                        uid = attrs.uid
                    })

                    msg.on('body', (stream) => {
                        let buffer = ''
                        stream.on('data', (chunk) => buffer += chunk.toString())
                        stream.once('end', async () => {
                            try {
                                const parsed = await simpleParser(buffer)
                                const warmupHeader = parsed.headers.get('x-instantly-warmup')
                                const warmupId = parsed.headers.get('x-warmup-id')

                                if (warmupHeader === 'true' && warmupId) {
                                    warmupEmails.push({
                                        uid,
                                        from: getAddressString(parsed.from),
                                        to: getAddressString(parsed.to),
                                        subject: parsed.subject || '',
                                        warmupId: warmupId as string,
                                        date: parsed.date || new Date(),
                                        folder
                                    })
                                }
                            } catch (e) {
                                console.error('Parse error:', e)
                            }
                        })
                    })
                })

                fetch.once('end', () => resolve(warmupEmails))
                fetch.once('error', reject)
            })
        })
    })
}

/**
 * Move email from one folder to another (for spam rescue)
 */
async function moveEmail(imap: Imap, uid: number, fromFolder: string, toFolder: string): Promise<boolean> {
    return new Promise((resolve) => {
        imap.openBox(fromFolder, false, (err) => {
            if (err) {
                resolve(false)
                return
            }

            imap.move(uid, toFolder, (err) => {
                resolve(!err)
            })
        })
    })
}

/**
 * Mark email as read
 */
async function markAsRead(imap: Imap, uid: number, folder: string): Promise<boolean> {
    return new Promise((resolve) => {
        imap.openBox(folder, false, (err) => {
            if (err) {
                resolve(false)
                return
            }

            imap.addFlags(uid, ['\\Seen'], (err) => {
                resolve(!err)
            })
        })
    })
}

/**
 * Detect warmup emails that need replies or spam rescue
 */
export async function detectWarmupEmails(account: {
    id: string
    email: string
    imapHost?: string | null
    imapPort?: number | null
    imapUser?: string | null
    imapPass?: string | null
    smtpPass?: string | null
}): Promise<{
    needsReply: WarmupEmail[]
    inSpam: WarmupEmail[]
    totalFound: number
}> {
    return withRetry(async (attempt) => {
        // Add sequential delay
        if (attempt === 0) {
            const jitter = Math.floor(Math.random() * 2000)
            await new Promise(resolve => setTimeout(resolve, jitter))
        }

        const config: ImapConfig = {
            host: account.imapHost || 'imap.gmail.com',
            port: account.imapPort || 993,
            user: account.imapUser || account.email,
            password: account.imapPass || account.smtpPass || '',
            tls: true
        }

        let imap: Imap | null = null
        try {
            imap = await connectImap(config)

            // Check inbox for warmup emails needing reply
            const inboxEmails = await searchWarmupEmails(imap, 'INBOX')

            // Check spam folder
            const spamFolders = ['[Gmail]/Spam', 'Spam', 'Junk', 'Junk E-mail']
            let spamEmails: WarmupEmail[] = []

            for (const spamFolder of spamFolders) {
                const found = await searchWarmupEmails(imap, spamFolder)
                if (found.length > 0) {
                    spamEmails = found
                    break
                }
            }

            await endImap(imap)

            // Filter inbox emails that haven't been replied to yet
            const needsReply = inboxEmails.filter(() => {
                return true // For now, mark all as needing reply
            })

            return {
                needsReply,
                inSpam: spamEmails,
                totalFound: inboxEmails.length + spamEmails.length
            }
        } catch (error) {
            if (imap) await endImap(imap)
            throw error
        }
    }, account.email, 'detectWarmupEmails')
}

/**
 * rescueFromSpam already has a catch block, let's enhance it too
 */
export async function rescueFromSpam(account: {
    id: string
    email: string
    imapHost?: string | null
    imapPort?: number | null
    imapUser?: string | null
    imapPass?: string | null
    smtpPass?: string | null
}): Promise<number> {
    return withRetry(async (attempt) => {
        // Add sequential delay
        if (attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const config: ImapConfig = {
            host: account.imapHost || 'imap.gmail.com',
            port: account.imapPort || 993,
            user: account.imapUser || account.email,
            password: account.imapPass || account.smtpPass || '',
            tls: true
        }

        let imap: Imap | null = null
        try {
            imap = await connectImap(config)

            const spamFolders = ['[Gmail]/Spam', 'Spam', 'Junk', 'Junk E-mail']
            let rescued = 0

            for (const spamFolder of spamFolders) {
                const spamEmails = await searchWarmupEmails(imap, spamFolder)

                for (const email of spamEmails) {
                    const success = await moveEmail(imap, email.uid, spamFolder, 'INBOX')
                    if (success) {
                        rescued++
                        console.log(`🛟 Rescued from spam: ${email.subject}`)
                        await markAsRead(imap, email.uid, 'INBOX')
                    }
                }
            }

            await endImap(imap)
            return rescued
        } catch (error) {
            if (imap) await endImap(imap)
            throw error
        }
    }, account.email, 'rescueFromSpam')
}

import { processWarmupReplies } from './warmup-reply'

/**
 * Process warmup maintenance for all active warmup accounts
 * (Spam rescue + Auto-replies)
 */
export async function processWarmupMaintenance() {
    const startTime = Date.now()
    const TIMEOUT_SAFETY_MARGIN = 240 * 1000 // 4 minutes

    const accounts = await prisma.emailAccount.findMany({
        where: {
            warmupEnabled: true,
            status: 'active'
        }
    })

    console.log(`[Warmup] Starting maintenance for ${accounts.length} accounts...`)
    let totalRescued = 0
    let totalReplied = 0

    for (const account of accounts) {
        // Safety timeout check
        const elapsed = Date.now() - startTime
        if (elapsed > TIMEOUT_SAFETY_MARGIN) {
            console.warn(`[Warmup] Approaching Vercel timeout (${elapsed/1000}s). Stopping maintenance early.`)
            break
        }

        try {
            // Sequential delay between accounts
            await new Promise(resolve => setTimeout(resolve, 3000))

            // 1. Rescue from spam
            const rescued = await rescueFromSpam(account)
            totalRescued += rescued

            // Small delay between ops
            await new Promise(resolve => setTimeout(resolve, 2000))

            // 2. Detect and reply to warmup emails
            const detection = await detectWarmupEmails(account)
            if (detection.needsReply.length > 0) {
                const replied = await processWarmupReplies(account, detection.needsReply)
                totalReplied += replied
            }
        } catch (error) {
            console.error(`[Warmup] Maintenance failed for ${account.email}:`, error)
        }
    }

    return { totalRescued, totalReplied, timedOut: (Date.now() - startTime) > TIMEOUT_SAFETY_MARGIN }
}
