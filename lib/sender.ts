import { prisma } from '@/lib/prisma'
import { isCampaignScheduled } from './scheduler'
import { dispatchWebhook } from './webhooks'
import { calculateWarmupLimit } from './warmup'
import nodemailer from 'nodemailer'
import { AutomationFilter } from './replies'
import { replaceVariables } from './variables'

// Helper to rewrite links
function injectTracking(html: string, eventId: string, baseUrl: string) {
    let newHtml = html

    // 1. Rewrite Links
    // Matches href="http..." or href='http...'
    // We use a simple regex for V1. Be careful with existing robust parsers.
    const linkRegex = /href=["'](http[^"']+)["']/g
    newHtml = newHtml.replace(linkRegex, (match, url) => {
        const encodedUrl = encodeURIComponent(url)
        const trackingUrl = `${baseUrl}/api/track/click?eid=${eventId}&url=${encodedUrl}`
        return `href="${trackingUrl}"`
    })

    // 2. Inject Pixel
    const pixelUrl = `${baseUrl}/api/track/open?eid=${eventId}`
    const pixelImg = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`

    // Append to body
    newHtml = newHtml + pixelImg
    return newHtml
}

export async function processBatch(options: { filter?: AutomationFilter } = {}) {
    const startTime = Date.now()
    const TIMEOUT_SAFETY_MARGIN = 240 * 1000 // 4 minutes

    const { filter } = options
    console.log("Starting batch processing...")

    // Base URL for tracking (assume localhost if not set)
    const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

    // 1. Fetch Active Campaigns with FILTERS
    const campaignWhere: any = { status: 'active' }

    if (filter?.campaignId) {
        campaignWhere.id = filter.campaignId
    }
    if (filter?.campaignName) {
        campaignWhere.name = { contains: filter.campaignName }
    }

    const campaigns = await prisma.campaign.findMany({
        where: campaignWhere,
        include: {
            campaignAccounts: {
                include: { emailAccount: true }
            },
            sequences: {
                include: { variants: true },
                orderBy: { stepNumber: 'asc' }
            }
        }
    })

    // 0. Fetch Blocklist
    const blockedEmails = (await prisma.blocklist.findMany({ select: { email: true } })).map(b => b.email.toLowerCase())

    let totalSent = 0
    let errors = 0

    for (const campaign of campaigns) {
        // Safety timeout check
        const elapsed = Date.now() - startTime
        if (elapsed > TIMEOUT_SAFETY_MARGIN) {
            console.warn(`[Sender] Approaching Vercel timeout (${elapsed / 1000}s). Stopping batch early.`)
            break
        }

        // --- 0. Parse Settings ---
        let settings: any = {}
        try {
            if (campaign.settings) {
                settings = JSON.parse(campaign.settings)
            }
        } catch (e) {
            console.error(`Failed to parse settings for campaign ${campaign.id}`, e)
        }

        // --- 2. Schedule Check ---
        const isScheduled = isCampaignScheduled({
            startTime: campaign.startTime,
            endTime: campaign.endTime,
            timezone: campaign.timezone,
            days: campaign.days
        })

        if (!isScheduled) continue
        if (campaign.sequences.length === 0) continue

        // --- 3. Account Availability Check with Warmup Mode & Provider Matching ---
        const availableAccounts = campaign.campaignAccounts
            .map(ca => ca.emailAccount)
            .filter(acc => {
                // Filter by Email Account ID if specified
                if (filter?.emailAccountId && acc.id !== filter.emailAccountId) return false

                if (acc.status !== 'active') return false

                // Check warmup mode
                if (acc.warmupEnabled) {
                    // Use centralized logic to ensure consistency (e.g. starting at 1 email)
                    const warmupLimit = calculateWarmupLimit(acc)
                    return acc.sentToday < warmupLimit
                }

                // Check Campaign Slow Ramp
                let currentLimit = acc.dailyLimit
                if (acc.slowRamp) {
                    const daysSinceCreated = Math.floor((Date.now() - new Date(acc.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    // Start at 20, increase by 20 each day
                    const rampedLimit = 20 + (daysSinceCreated * 20)
                    currentLimit = Math.min(rampedLimit, acc.dailyLimit)
                }

                return acc.sentToday < currentLimit
            })

        if (availableAccounts.length === 0) continue

        // --- 4. Campaign Limit Check ---
        if (campaign.dailyLimit && campaign.sentCount >= campaign.dailyLimit) continue

        // --- 5. Find Due Leads with FILTERS ---
        const excludedStatuses = ['unsubscribed', 'bounced', 'sequence_complete']
        if (campaign.stopOnReply) {
            excludedStatuses.push('replied')
        }

        const now = new Date()

        const leadWhere: any = {
            campaignId: campaign.id,
            status: { notIn: excludedStatuses },
            OR: [
                { nextSendAt: null }, // Never sent before
                { nextSendAt: { lte: now } } // Time to send next email
            ]
        }

        // Apply Lead Status Filter
        if (filter?.leadStatus) {
            leadWhere.status = filter.leadStatus
        }

        // Apply Tag Filter
        if (filter?.tag) {
            leadWhere.tags = { some: { tag: { name: filter.tag } } }
        }

        let candidateLeads = await prisma.lead.findMany({
            where: leadWhere,
            include: {
                events: {
                    where: { type: 'sent' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            take: 10 // Tight batch to prevent Vercel timeout
        })

        // Sort by priority if needed
        if (settings.prioritizeNewLeads) {
            candidateLeads.sort((a, b) => {
                const aIsNew = a.events.length === 0
                const bIsNew = b.events.length === 0
                if (aIsNew && !bIsNew) return -1
                if (!aIsNew && bIsNew) return 1
                return 0
            })
        }

        // Filter out Blocklisted Emails
        candidateLeads = candidateLeads.filter(l => !blockedEmails.includes(l.email.toLowerCase()))

        // Limit to small batch size to prevent timeouts
        candidateLeads = candidateLeads.slice(0, 10) // Reduced from 20

        let sentForThisCampaign = 0

        for (const lead of candidateLeads) {
            // Safety timeout check
            const elapsed = Date.now() - startTime
            if (elapsed > TIMEOUT_SAFETY_MARGIN) {
                console.warn(`[Sender] Approaching timeout in lead loop (${elapsed / 1000}s). Stopping batch.`)
                return { totalSent, errors, timedOut: true }
            }

            if (sentForThisCampaign >= availableAccounts.length * 5) break

            // Determine Next Step
            let nextStepNumber = 1
            let lastEventDate = null
            let previousEvent = null

            if (lead.events.length > 0) {
                const sentEvents = await prisma.sendingEvent.findMany({
                    where: { leadId: lead.id, type: 'sent', campaignId: campaign.id },
                    orderBy: { createdAt: 'desc' }
                })
                const sentCount = sentEvents.length
                nextStepNumber = sentCount + 1
                if (sentCount > 0) {
                    lastEventDate = sentEvents[0].createdAt
                    previousEvent = sentEvents[0]
                }
            }

            if (nextStepNumber > campaign.sequences.length) {
                if (lead.status !== 'sequence_complete') {
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { status: 'sequence_complete', nextSendAt: null }
                    })
                }
                continue
            }

            const step = campaign.sequences[nextStepNumber - 1]

            // Check Step Gap
            if (nextStepNumber > 1 && lastEventDate) {
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - lastEventDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (diffDays < step.dayGap) continue
            }

            // Duplicate Prevention
            const alreadySent = await prisma.sendingEvent.findFirst({
                where: {
                    leadId: lead.id,
                    campaignId: campaign.id,
                    type: 'sent',
                    metadata: { contains: `"step":${nextStepNumber}` }
                }
            })
            if (alreadySent) continue

            // --- ACCOUNT SELECTION with PROVIDER MATCHING ---
            let account
            let accountsPool = availableAccounts

            // Provider Matching
            if (settings.providerMatching) {
                const leadDomain = lead.email.split('@')[1]
                let requiredProvider: string | null = null

                if (leadDomain === 'gmail.com') requiredProvider = 'google'
                else if (leadDomain === 'outlook.com' || leadDomain === 'hotmail.com') requiredProvider = 'microsoft'

                if (requiredProvider) {
                    const matchedAccounts = availableAccounts.filter(a => a.provider === requiredProvider)
                    if (matchedAccounts.length > 0) {
                        accountsPool = matchedAccounts
                    }
                }
            }

            // Sticky Sender Logic (Try to use same account for follow-ups)
            if (nextStepNumber > 1 && previousEvent && previousEvent.emailAccountId) {
                const stickyAccount = accountsPool.find(a => a.id === previousEvent!.emailAccountId)
                if (stickyAccount) {
                    account = stickyAccount
                } else {
                    // Fallback to round-robin within pool
                    const accountIndex = campaign.lastAccountIndex || 0
                    account = accountsPool[accountIndex % accountsPool.length]
                }
            } else {
                // Round-robin
                const accountIndex = campaign.lastAccountIndex || 0
                account = accountsPool[accountIndex % accountsPool.length]

                await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { lastAccountIndex: (accountIndex + 1) % availableAccounts.length } // Update global index based on full list to keep rotation moving
                })
            }

            try {
                // Select Variant
                let subject = ""
                let body = ""
                // @ts-ignore
                const variants = (step as any).variants

                if (variants && variants.length > 0) {
                    const variant = variants[Math.floor(Math.random() * variants.length)]
                    // @ts-ignore
                    subject = variant.subject || ""
                    // @ts-ignore
                    body = variant.body
                } else {
                    // @ts-ignore
                    subject = step.subject || ""
                    // @ts-ignore
                    body = step.body || ""
                }

                if (!subject && !body) continue

                // Replace Variables
                subject = replaceVariables(subject, lead)
                body = replaceVariables(body, lead)

                // Create Sending Event
                const sentEvent = await prisma.sendingEvent.create({
                    data: {
                        type: 'pending',
                        campaignId: campaign.id,
                        leadId: lead.id,
                        emailAccountId: account.id,
                        metadata: JSON.stringify({ accountId: account.id, subject, step: nextStepNumber })
                    }
                })

                // Construct Email Body (Text vs HTML)
                let finalHtml: string | undefined = `${body}`
                let finalText: string | undefined = undefined

                // Check Text-Only Settings
                const isTextOnly = settings.sendAsTextOnly || (settings.sendFirstAsText && nextStepNumber === 1)

                if (isTextOnly) {
                    finalText = body.replace(/<[^>]*>/g, '') // Strip HTML tags for text-only mode

                    finalHtml = undefined // No HTML
                } else {

                    // Inject Tracking if HTML
                    if (campaign.trackOpens || campaign.trackLinks) {
                        finalHtml = injectTracking(finalHtml!, sentEvent.id, BASE_URL)
                    }
                }

                // Always use SMTP with app password (OAuth2 removed for stability)
                const transporter = nodemailer.createTransport({
                    host: account.smtpHost!,
                    port: account.smtpPort!,
                    secure: account.smtpPort === 465,
                    auth: { user: account.smtpUser!, pass: account.smtpPass! }
                })

                const mailOptions: any = {
                    from: `"${account.firstName} ${account.lastName}" <${account.email}>`,
                    to: lead.email,
                    subject: subject,
                    html: finalHtml,
                    text: finalText,
                    cc: settings.ccRecipients,
                    bcc: settings.bccRecipients
                }

                // Threading
                if (nextStepNumber > 1 && previousEvent && previousEvent.messageId) {
                    mailOptions.headers = {
                        'In-Reply-To': previousEvent.messageId,
                        'References': previousEvent.messageId
                    }
                }

                const info = await transporter.sendMail(mailOptions)
                const messageId = info.messageId.replace(/[<>]/g, '')

                // Update DB
                await prisma.$transaction([
                    prisma.lead.update({
                        where: { id: lead.id },
                        data: { status: 'contacted' }
                    }),
                    prisma.sendingEvent.update({
                        where: { id: sentEvent.id },
                        data: { type: 'sent', messageId }
                    }),
                    prisma.campaign.update({
                        where: { id: campaign.id },
                        data: { sentCount: { increment: 1 } }
                    }),
                    prisma.emailAccount.update({
                        where: { id: account.id },
                        data: { sentToday: { increment: 1 } }
                    }),
                    prisma.campaignStat.upsert({
                        where: { campaignId_date: { campaignId: campaign.id, date: new Date(new Date().setHours(0, 0, 0, 0)) } },
                        create: { campaignId: campaign.id, date: new Date(new Date().setHours(0, 0, 0, 0)), sent: 1 },
                        update: { sent: { increment: 1 } }
                    })
                ])

                // Schedule Next Step
                const nextStep = campaign.sequences[nextStepNumber]
                if (nextStep) {
                    const nextSendDate = new Date()
                    nextSendDate.setDate(nextSendDate.getDate() + nextStep.dayGap)
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { nextSendAt: nextSendDate }
                    })
                } else {
                    // No more steps after this one
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { status: 'sequence_complete', nextSendAt: null }
                    })
                }

                totalSent++
                sentForThisCampaign++
                console.log(`Sent Step ${nextStepNumber} to ${lead.email} via ${account.email}`)

                // Throttling with Custom Time Gap
                const minGap = (settings.minTimeGap || 20) * 1000
                let baseDelayMs = 2000 // default 2s for Hobby plan serverless compatibility
                if (settings.minTimeGap) {
                    baseDelayMs = Math.min(parseInt(settings.minTimeGap) * 1000, 3000) // Cap at 3s to prevent timeout
                }

                let randomDelayMs = 1000 // default additional 1s
                if (settings.randomTimeGap) {
                    randomDelayMs = Math.min(parseInt(settings.randomTimeGap) * 1000, 2000) // Cap at 2s to prevent timeout
                }

                const delay = baseDelayMs + Math.floor(Math.random() * randomDelayMs)
                console.log(`Waiting ${delay / 1000}s before next email...`)
                await new Promise(resolve => setTimeout(resolve, delay))

            } catch (error: any) {
                console.error(`Failed to send to ${lead.email}`, error)
                errors++

                // Log error to the account to surface in UI
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: {
                        status: 'error',
                        errorDetail: `Sending failed: ${error.message || 'Unknown SMTP error'}`
                    }
                }).catch(e => console.error('Failed to update account error status', e))
            }
        }

        // --- Campaign Auto-Completion Logic ---
        const activeLeadsCount = await prisma.lead.count({
            where: {
                campaignId: campaign.id,
                status: { notIn: excludedStatuses }
            }
        })

        if (activeLeadsCount === 0) {
            // Check if there are any leads at all to prevent marking empty campaigns as completed
            const totalLeadsCount = await prisma.lead.count({ where: { campaignId: campaign.id } })
            if (totalLeadsCount > 0) {
                const updatedCampaign = await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { status: 'completed' }
                })

                // Dispatch Webhook
                if (updatedCampaign.userId) {
                    dispatchWebhook(updatedCampaign.userId, "campaign.finished", {
                        campaignId: updatedCampaign.id,
                        name: updatedCampaign.name,
                        status: updatedCampaign.status
                    })
                }
                console.log(`Campaign ${campaign.id} marked as completed.`)
            }
        }
    }

    return { totalSent, errors }
}
