import Imap from 'imap'
import { simpleParser } from 'mailparser'
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
            tlsOptions: { rejectUnauthorized: false }
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

                fetch.on('message', (msg, seqno) => {
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
                                        from: parsed.from?.text || '',
                                        to: parsed.to?.text || '',
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
export async function detectWarmupEmails(account: any): Promise<{
    needsReply: WarmupEmail[]
    inSpam: WarmupEmail[]
    totalFound: number
}> {
    const config: ImapConfig = {
        host: account.imapHost || 'imap.gmail.com',
        port: account.imapPort || 993,
        user: account.imapUser || account.email,
        password: account.imapPass || '',
        tls: true
    }

    try {
        const imap = await connectImap(config)

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

        imap.end()

        // Filter inbox emails that haven't been replied to yet
        const needsReply = inboxEmails.filter(email => {
            // Check if we've already replied (would need DB tracking)
            return true // For now, mark all as needing reply
        })

        return {
            needsReply,
            inSpam: spamEmails,
            totalFound: inboxEmails.length + spamEmails.length
        }
    } catch (error) {
        console.error(`IMAP detection failed for ${account.email}:`, error)
        return { needsReply: [], inSpam: [], totalFound: 0 }
    }
}

/**
 * Rescue warmup emails from spam folder
 */
export async function rescueFromSpam(account: any): Promise<number> {
    const config: ImapConfig = {
        host: account.imapHost || 'imap.gmail.com',
        port: account.imapPort || 993,
        user: account.imapUser || account.email,
        password: account.imapPass || '',
        tls: true
    }

    try {
        const imap = await connectImap(config)

        const spamFolders = ['[Gmail]/Spam', 'Spam', 'Junk', 'Junk E-mail']
        let rescued = 0

        for (const spamFolder of spamFolders) {
            const spamEmails = await searchWarmupEmails(imap, spamFolder)

            for (const email of spamEmails) {
                const success = await moveEmail(imap, email.uid, spamFolder, 'INBOX')
                if (success) {
                    rescued++
                    console.log(`🛟 Rescued from spam: ${email.subject}`)

                    // Mark as read so it doesn't trigger notifications
                    await markAsRead(imap, email.uid, 'INBOX')

                    // Log the rescue
                    await prisma.warmupLog.create({
                        data: {
                            accountId: account.id,
                            action: 'spam_rescue',
                            warmupId: email.warmupId,
                            fromEmail: email.from,
                            details: `Moved from ${spamFolder} to INBOX`
                        }
                    }).catch(() => { }) // Ignore if table doesn't exist
                }
            }
        }

        imap.end()
        return rescued
    } catch (error) {
        console.error(`Spam rescue failed for ${account.email}:`, error)
        return 0
    }
}
