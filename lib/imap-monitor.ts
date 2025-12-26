import Imap from 'node-imap'
import { simpleParser } from 'mailparser'
import { prisma } from '@/lib/prisma'
import type { EmailAccount } from '@prisma/client'

/**
 * Check inbox for replies to sent emails
 */
export async function checkForReplies(account: EmailAccount) {
    return new Promise<number>((resolve, reject) => {
        const imap = new Imap({
            user: account.imapUser || account.email,
            password: account.imapPass || account.smtpPass || '',
            host: account.imapHost || 'imap.gmail.com',
            port: account.imapPort || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        })

        let repliesFound = 0

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error(`IMAP error opening inbox for ${account.email}:`, err)
                    imap.end()
                    return reject(err)
                }

                // Search for unread emails from the last 7 days
                const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]]

                imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        console.error(`IMAP search error for ${account.email}:`, err)
                        imap.end()
                        return reject(err)
                    }

                    if (!results || results.length === 0) {
                        console.log(`No unread emails for ${account.email}`)
                        imap.end()
                        return resolve(0)
                    }

                    const fetch = imap.fetch(results, { bodies: '', markSeen: false })

                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            simpleParser(stream, async (err, parsed) => {
                                if (err) {
                                    console.error('Email parsing error:', err)
                                    return
                                }

                                try {
                                    // Check if this is a reply (has In-Reply-To or References header)
                                    const inReplyTo = parsed.inReplyTo
                                    const references = parsed.references
                                    const from = parsed.from?.value[0]?.address

                                    if (!from) return

                                    // Find the lead by email
                                    const lead = await prisma.lead.findFirst({
                                        where: { email: from }
                                    })

                                    if (!lead) return

                                    // Check if we sent an email to this lead
                                    const sentEvent = await prisma.sendingEvent.findFirst({
                                        where: {
                                            leadId: lead.id,
                                            type: 'sent',
                                            emailAccountId: account.id
                                        },
                                        orderBy: { createdAt: 'desc' }
                                    })

                                    if (!sentEvent) return

                                    // This is a reply! Record it
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

                    fetch.once('error', (err) => {
                        console.error('Fetch error:', err)
                        imap.end()
                        reject(err)
                    })

                    fetch.once('end', () => {
                        console.log(`Finished checking ${account.email} - Found ${repliesFound} replies`)
                        imap.end()
                        resolve(repliesFound)
                    })
                })
            })
        })

        imap.once('error', (err) => {
            console.error(`IMAP connection error for ${account.email}:`, err)
            reject(err)
        })

        imap.once('end', () => {
            console.log(`IMAP connection closed for ${account.email}`)
        })

        imap.connect()
    })
}

/**
 * Check inbox for bounce messages
 */
export async function checkForBounces(account: EmailAccount) {
    return new Promise<number>((resolve, reject) => {
        const imap = new Imap({
            user: account.imapUser || account.email,
            password: account.imapPass || account.smtpPass || '',
            host: account.imapHost || 'imap.gmail.com',
            port: account.imapPort || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        })

        let bouncesFound = 0

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error(`IMAP error opening inbox for ${account.email}:`, err)
                    imap.end()
                    return reject(err)
                }

                // Search for bounce messages (from mailer-daemon or postmaster)
                const searchCriteria = [
                    'UNSEEN',
                    ['OR', ['FROM', 'mailer-daemon'], ['FROM', 'postmaster']],
                    ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
                ]

                imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        console.error(`IMAP search error for ${account.email}:`, err)
                        imap.end()
                        return reject(err)
                    }

                    if (!results || results.length === 0) {
                        console.log(`No bounce messages for ${account.email}`)
                        imap.end()
                        return resolve(0)
                    }

                    const fetch = imap.fetch(results, { bodies: '', markSeen: false })

                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            simpleParser(stream, async (err, parsed) => {
                                if (err) {
                                    console.error('Email parsing error:', err)
                                    return
                                }

                                try {
                                    // Extract bounced email address from body
                                    const bodyText = parsed.text || ''
                                    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
                                    const emails = bodyText.match(emailRegex) || []

                                    for (const email of emails) {
                                        // Find lead by email
                                        const lead = await prisma.lead.findFirst({
                                            where: { email: email }
                                        })

                                        if (!lead) continue

                                        // Check if we sent to this lead
                                        const sentEvent = await prisma.sendingEvent.findFirst({
                                            where: {
                                                leadId: lead.id,
                                                type: 'sent',
                                                emailAccountId: account.id
                                            },
                                            orderBy: { createdAt: 'desc' }
                                        })

                                        if (!sentEvent) continue

                                        // Record bounce
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

                    fetch.once('error', (err) => {
                        console.error('Fetch error:', err)
                        imap.end()
                        reject(err)
                    })

                    fetch.once('end', () => {
                        console.log(`Finished checking bounces for ${account.email} - Found ${bouncesFound} bounces`)
                        imap.end()
                        resolve(bouncesFound)
                    })
                })
            })
        })

        imap.once('error', (err) => {
            console.error(`IMAP connection error for ${account.email}:`, err)
            reject(err)
        })

        imap.once('end', () => {
            console.log(`IMAP connection closed for ${account.email}`)
        })

        imap.connect()
    })
}
