import { prisma } from '@/lib/prisma'
import imaps from 'imap-simple'
import { simpleParser } from 'mailparser'

export async function checkReplies() {
    let checked = 0
    let detected = 0
    let errors = 0

    const accounts = await prisma.emailAccount.findMany({
        where: { status: 'active' }
    })

    console.log(`Checking replies for ${accounts.length} accounts...`)

    for (const account of accounts) {
        checked++
        try {
            const config = {
                imap: {
                    user: account.imapUser || account.email,
                    password: account.imapPass || account.smtpPass!,
                    host: account.imapHost!,
                    port: account.imapPort || 993,
                    tls: true,
                    authTimeout: 10000 // Increased timeout
                }
            }

            const connection = await imaps.connect(config)
            await connection.openBox('INBOX')

            // Fetch UNSEEN messages
            const searchCriteria = ['UNSEEN']
            // We need parts to parse (Header + Body)
            const fetchOptions = { bodies: [''], markSeen: false }

            const messages = await connection.search(searchCriteria, fetchOptions)

            for (const message of messages) {
                // Parse full email
                const all = message.parts.find((part: { which: string }) => part.which === '')
                const id = message.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";

                // mailparser needs the full source
                const parsed = await simpleParser(idHeader + (all ? all.body : ""))

                if (!parsed.from?.text) continue

                const fromEmailMatch = parsed.from.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
                if (!fromEmailMatch || !fromEmailMatch[0]) continue
                const fromEmail = fromEmailMatch[0]

                // Find matching Lead
                const lead = await prisma.lead.findFirst({
                    where: {
                        email: fromEmail,
                        status: { in: ['contacted', 'new', 'replied'] } // Include replied to catch follow-ups
                    }
                })

                if (lead) {
                    const subject = parsed.subject || 'No Subject'
                    const bodyText = parsed.text || ''
                    const bodyHtml = parsed.html || ''
                    const snippet = bodyText.substring(0, 200)

                    // Check if we already logged this reply? (deduplication)
                    // Simple check: do we have a reply event from this lead in the last hour?
                    // Better: check message-id if strictly needed. For V1 we accept duplicate checks if crons overlap (unlikely with 1 min gap).

                    // 0. Smart Detection (OOO / Bounce)
                    const oooRegex = /(out of office|auto-reply|automatic reply|away from email)/i
                    const bounceRegex = /(undeliverable|delivery status notification|failure notice|mailer-daemon|postmaster)/i

                    let newStatus = 'replied'
                    let eventType = 'reply'
                    let isOOO = false

                    if (bounceRegex.test(subject) || bounceRegex.test(snippet)) {
                        newStatus = 'bounced'
                        eventType = 'bounce'
                    } else if (oooRegex.test(subject) || oooRegex.test(snippet)) {
                        isOOO = true
                        console.log(`Detected OOO from ${fromEmail}`)
                    }

                    // 1. Log Event with BODY
                    await prisma.sendingEvent.create({
                        data: {
                            type: eventType,
                            campaignId: lead.campaignId,
                            leadId: lead.id,
                            metadata: JSON.stringify({
                                subject,
                                snippet,
                                bodyText,
                                messageId: parsed.messageId,
                                isOOO
                            })
                        }
                    })

                    // 2. Update Lead Status
                    if (lead.status !== 'replied' && lead.status !== 'bounced') {
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: { status: newStatus }
                        })
                        // 3. Update Stats
                        if (newStatus === 'replied') {
                            await prisma.campaign.update({
                                where: { id: lead.campaignId },
                                data: { replyCount: { increment: 1 } }
                            })
                            await prisma.campaignStat.upsert({
                                where: { campaignId_date: { campaignId: lead.campaignId, date: new Date(new Date().setHours(0, 0, 0, 0)) } },
                                create: { campaignId: lead.campaignId, date: new Date(new Date().setHours(0, 0, 0, 0)), replied: 1 },
                                update: { replied: { increment: 1 } }
                            })
                        } else if (newStatus === 'bounced') {
                            await prisma.campaign.update({
                                where: { id: lead.campaignId },
                                data: { bounceCount: { increment: 1 } }
                            })
                            await prisma.campaignStat.upsert({
                                where: { campaignId_date: { campaignId: lead.campaignId, date: new Date(new Date().setHours(0, 0, 0, 0)) } },
                                create: { campaignId: lead.campaignId, date: new Date(new Date().setHours(0, 0, 0, 0)), bounced: 1 },
                                update: { bounced: { increment: 1 } }
                            })
                        }
                    }

                    detected++
                    console.log(`Detected reply from ${fromEmail}`)
                }
            }

            connection.end()

        } catch (error) {
            console.error(`IMAP Error for ${account.email}`, error)
            errors++
        }
    }

    return { checked, detected, errors }
}
