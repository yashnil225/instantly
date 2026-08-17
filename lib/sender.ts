import { prisma } from '@/lib/prisma'
import { isCampaignScheduled } from './scheduler'
import { dispatchWebhook } from './webhooks'
import { calculateWarmupLimit } from './warmup'
import nodemailer from 'nodemailer'
import { AutomationFilter } from './replies'
import { replaceVariables } from './variables'

/** Returns known SMTP defaults for major providers to prevent localhost fallback */
function getSmtpDefaults(provider: string): { host: string; port: number } | null {
    switch (provider?.toLowerCase()) {
        case 'google': return { host: 'smtp.gmail.com', port: 587 }
        case 'microsoft': return { host: 'smtp.office365.com', port: 587 }
        case 'outlook': return { host: 'smtp.office365.com', port: 587 }
        default: return null
    }
}

// Helper to rewrite links
function injectTracking(html: string, eventId: string, baseUrl: string, trackLinks: boolean, trackOpens: boolean) {
    let newHtml = html

    // 1. Rewrite Links
    if (trackLinks) {
        const linkRegex = /href=["'](http[^"']+)["']/g
        newHtml = newHtml.replace(linkRegex, (match, url) => {
            const encodedUrl = encodeURIComponent(url)
            const trackingUrl = `${baseUrl}/api/track/click?eid=${eventId}&url=${encodedUrl}`
            return `href="${trackingUrl}"`
        })
    }

    // 2. Inject Pixel
    if (trackOpens) {
        const pixelUrl = `${baseUrl}/api/track/open?eid=${eventId}`
        const pixelImg = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`
        newHtml = newHtml + pixelImg
    }
    
    return newHtml
}

export async function processBatch(options: { filter?: AutomationFilter } = {}) {
    const startTime = Date.now()
    const TIMEOUT_SAFETY_MARGIN = 48 * 1000 // 48 seconds to aggressively avoid 60s Vercel limit

    const { filter } = options
    console.log("Starting batch processing...")

    // Base URL for tracking (use NEXT_PUBLIC_APP_URL or VERCEL_URL first for cloud deployments)
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    // 1. Fetch Active Campaigns with FILTERS
    const campaignWhere: any = { status: { in: ['active', 'Active'] } }

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
                include: {
                    variants: {
                        include: { attachments: true }
                    }
                },
                orderBy: { stepNumber: 'asc' }
            }
        }
    })

    // 0. Fetch Blocklist
    const blockedEmails = (await prisma.blocklist.findMany({ select: { email: true } })).map((b: any) => b.email.toLowerCase())

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
        let scheduleStart = campaign.startTime
        let scheduleEnd = campaign.endTime
        let scheduleTimezone = campaign.timezone
        let scheduleDays = campaign.days

        if (campaign.schedules) {
            try {
                const parsedSchedules = typeof campaign.schedules === 'string' ? JSON.parse(campaign.schedules) : campaign.schedules
                if (Array.isArray(parsedSchedules)) {
                    const activeSched = parsedSchedules.find((s: any) => s.isActive) || parsedSchedules[0]
                    if (activeSched) {
                        if (activeSched.startTime) scheduleStart = activeSched.startTime
                        if (activeSched.endTime) scheduleEnd = activeSched.endTime
                        if (activeSched.timezone) scheduleTimezone = activeSched.timezone
                        if (activeSched.days) scheduleDays = Array.isArray(activeSched.days) ? activeSched.days.join(',') : activeSched.days
                    }
                }
            } catch (e) {
                console.error(`Failed to parse schedules for campaign ${campaign.id}`, e)
            }
        }

        const isScheduled = isCampaignScheduled({
            startTime: scheduleStart,
            endTime: scheduleEnd,
            timezone: scheduleTimezone,
            days: scheduleDays
        })

        if (!isScheduled) {
            console.log(`[Sender] Campaign "${campaign.name || campaign.id}" outside scheduled window/days (allowed: ${scheduleDays || 'all'}, hours: ${scheduleStart}-${scheduleEnd}). Skipping.`)
            continue
        }
        if (campaign.sequences.length === 0) {
            console.log(`[Sender] Campaign "${campaign.name || campaign.id}" has no sequence steps. Skipping.`)
            continue
        }
        if (!campaign.campaignAccounts || campaign.campaignAccounts.length === 0) {
            console.log(`[Sender] Campaign "${campaign.name || campaign.id}" has no email accounts assigned. Skipping.`)
            continue
        }

        // --- 3. Account Availability Check with Warmup Mode & Time Gap Pacing ---
        const minGapMins = Math.max(1, parseInt(settings.minTimeGap) || 9)
        const randomGapMins = Math.max(0, parseInt(settings.randomTimeGap) || 5)
        const baseGapMs = minGapMins * 60 * 1000


        console.log(`[Sender] Campaign ${campaign.id}: minTimeGap=${minGapMins}m, randomTimeGap=${randomGapMins}m, ${campaign.campaignAccounts.length} account(s) assigned`)

        const todayUTCStart = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')

        const eligibleAccounts = []
        for (const ca of campaign.campaignAccounts) {
            const acc = ca.emailAccount
            if (filter?.emailAccountId && acc.id !== filter.emailAccountId) continue
            if (acc.status !== 'active') {
                console.log(`[Sender] ❌ ${acc.email} — status is "${acc.status}", not active`)
                continue
            }

            const resolvedHost = acc.smtpHost || getSmtpDefaults(acc.provider)?.host
            if (!resolvedHost) {
                console.warn(`[Sender] ❌ ${acc.email} — no SMTP host configured (provider: ${acc.provider})`)
                continue
            }

            // Count actual sends today from events (not stale sentToday DB field)
            const actualSentToday = await prisma.sendingEvent.count({
                where: {
                    emailAccountId: acc.id,
                    type: 'sent',
                    createdAt: { gte: todayUTCStart },
                    metadata: { contains: '"step":' }
                }
            })

            // Check if provider quota was hit earlier today
            if (acc.errorDetail && acc.errorDetail.includes('Daily provider quota reached')) {
                if (new Date(acc.updatedAt) >= todayUTCStart) {
                    console.log(`[Sender] ❌ ${acc.email} — provider daily quota reached today (${actualSentToday} emails sent before quota was hit). Paused until tomorrow.`)
                    continue
                } else {
                    // New day started, auto-clear stale quota error
                    await prisma.emailAccount.update({
                        where: { id: acc.id },
                        data: { errorDetail: null }
                    }).catch(() => {})
                }
            }

            // Check Campaign Daily Limit / Slow Ramp
            let currentLimit = acc.dailyLimit || 50
            if (acc.slowRamp) {
                const daysSinceCreated = Math.floor((Date.now() - new Date(acc.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                const rampedLimit = 20 + (daysSinceCreated * 20)
                currentLimit = Math.min(rampedLimit, acc.dailyLimit || 50)
            }

            if (actualSentToday >= currentLimit) {
                console.log(`[Sender] ❌ ${acc.email} — daily limit reached (${actualSentToday}/${currentLimit}, slowRamp=${acc.slowRamp})`)
                continue
            }

            // Check Account Pacing (Has this account rested enough since its last campaign send?)
            const lastSentEvent = await prisma.sendingEvent.findFirst({
                where: { 
                    emailAccountId: acc.id, 
                    type: 'sent',
                    campaignId: campaign.id,
                    metadata: { contains: '"step":' }
                },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            })

            if (lastSentEvent) {
                const elapsedMs = Date.now() - new Date(lastSentEvent.createdAt).getTime()
                const requiredGapMs = minGapMins * 60 * 1000
                if (elapsedMs < requiredGapMs) {
                    const remainingMins = Math.ceil((requiredGapMs - elapsedMs) / 60000)
                    console.log(`[Sender] ❌ ${acc.email} — cooling down (${remainingMins}m remaining of ${minGapMins}m gap, last sent ${Math.round(elapsedMs / 60000)}m ago)`)
                    continue
                }
                console.log(`[Sender] ✅ ${acc.email} — cooldown passed (last sent ${Math.round(elapsedMs / 60000)}m ago, gap=${minGapMins}m)`)
            } else {
                console.log(`[Sender] ✅ ${acc.email} — no previous campaign sends found, ready to go`)
            }

            eligibleAccounts.push(acc)
        }

        const availableAccounts = eligibleAccounts
        if (availableAccounts.length === 0) {
            console.log(`[Sender] All assigned inboxes for campaign ${campaign.id} are in cooldown. Skipping this cycle.`)
            continue

        }

        let campaignRemainingToday = Infinity
        if (campaign.dailyLimit) {
            const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
            const statsToday = await prisma.campaignStat.findUnique({
                where: {
                    campaignId_date: {
                        campaignId: campaign.id,
                        date: todayUTC
                    }
                }
            })
            if (statsToday && statsToday.sent >= campaign.dailyLimit) continue
            if (statsToday) campaignRemainingToday = campaign.dailyLimit - statsToday.sent
            else campaignRemainingToday = campaign.dailyLimit
        }

        // --- 4. Max New Leads Enforcement ---
        let maxNewLeadsLimit = settings.maxNewLeads ? parseInt(settings.maxNewLeads) : null
        let newLeadsSentToday = 0
        if (maxNewLeadsLimit) {
            const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
            newLeadsSentToday = await prisma.sendingEvent.count({
                where: {
                    campaignId: campaign.id,
                    type: 'sent',
                    createdAt: { gte: todayUTC },
                    metadata: { contains: '"step":1' }
                }
            })
        }

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

        // Note: auto_reply / out_of_office filtering is safely handled in the loop below
        // to avoid SQL NULL comparison issues on nullable aiLabel field

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
            take: 10
        })

        // Sort by priority if needed
        if (settings.prioritizeNewLeads) {
            candidateLeads.sort((a: any, b: any) => {
                const aIsNew = a.events.length === 0
                const bIsNew = b.events.length === 0
                if (aIsNew && !bIsNew) return -1
                if (!aIsNew && bIsNew) return 1
                return 0
            })
        }

        // Filter out Blocklisted Emails
        candidateLeads = candidateLeads.filter((l: any) => !blockedEmails.includes(l.email.toLowerCase()))

        // Limit to small batch size to prevent timeouts and enforce hard limits!
        const dynamicLimit = Math.min(5, campaignRemainingToday)
        candidateLeads = candidateLeads.slice(0, dynamicLimit)

        let sentForThisCampaign = 0

        for (const lead of candidateLeads) {
            // Safety timeout check
            const elapsed = Date.now() - startTime
            if (elapsed > TIMEOUT_SAFETY_MARGIN) {
                console.warn(`[Sender] Approaching timeout in lead loop (${elapsed / 1000}s). Stopping batch.`)
                return { totalSent, errors, timedOut: true }
            }

            // --- Atomic Event-Based Limit Check ---
            if (campaign.dailyLimit) {
                const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
                
                const actualSentToday = await prisma.sendingEvent.count({
                    where: {
                        campaignId: campaign.id,
                        type: { in: ['sent', 'pending', 'failed', 'delivered', 'bounced'] },
                        createdAt: { gte: todayUTC }
                    }
                })

                if (actualSentToday >= campaign.dailyLimit) {
                    console.warn(`[Sender] Campaign ${campaign.id} reached daily limit (${campaign.dailyLimit}) mid-batch. Automatically pausing.`)
                    
                    const tomorrow = new Date()
                    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
                    tomorrow.setUTCHours(0, 0, 0, 0)

                    await prisma.campaign.update({
                        where: { id: campaign.id },
                        data: {
                            status: 'paused',
                            settings: JSON.stringify({
                                ...settings,
                                autoResumeAt: tomorrow.toISOString(),
                                autoResumeReason: 'daily_limit'
                            })
                        }
                    })
                    
                    break
                }
            }

            // Skip invalid emails to prevent EENVELOPE errors
            if (!lead.email || !lead.email.includes('@')) {
                console.warn(`[Sender] Skipping lead ${lead.id} with invalid email: ${lead.email}`)
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: 'bounced' }
                })
                continue
            }

            // --- Stop on Company Reply Check ---
            if (settings.stopOnCompanyReply) {
                const leadDomain = lead.email.split('@')[1]?.toLowerCase()
                const commonFreeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'mail.com']
                if (leadDomain && !commonFreeDomains.includes(leadDomain)) {
                    const companyRepliedLead = await prisma.lead.findFirst({
                        where: {
                            campaignId: campaign.id,
                            status: 'replied',
                            email: { endsWith: `@${leadDomain}` }
                        }
                    })
                    if (companyRepliedLead) {
                        console.log(`[Sender] Skipping ${lead.email} - colleague ${companyRepliedLead.email} already replied from @${leadDomain}`)
                        continue
                    }
                }
            }

            // --- Stop on Auto Reply Check ---
            if (settings.stopOnAutoReply && (lead.aiLabel === 'auto_reply' || lead.aiLabel === 'out_of_office')) {
                console.log(`[Sender] Skipping ${lead.email} due to auto_reply / out_of_office label`)
                continue
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

            // Max New Leads per Day Check
            if (nextStepNumber === 1 && maxNewLeadsLimit && newLeadsSentToday >= maxNewLeadsLimit) {
                console.log(`[Sender] Reached max new leads limit (${maxNewLeadsLimit}) today for campaign ${campaign.id}. Skipping new lead ${lead.email}`)
                continue
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

            // Check Step Gap (convert dayGap to milliseconds for strict comparison)
            if (nextStepNumber > 1 && lastEventDate) {
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - lastEventDate.getTime())
                const requiredGapMs = step.dayGap * 24 * 60 * 60 * 1000
                if (diffTime < requiredGapMs) continue
            }

            // Duplicate Prevention
            const alreadySent = await prisma.sendingEvent.findFirst({
                where: {
                    leadId: lead.id,
                    campaignId: campaign.id,
                    type: { in: ['sent', 'pending'] },
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
                    const matchedAccounts = availableAccounts.filter((a: any) => a.provider === requiredProvider)
                    if (matchedAccounts.length > 0) {
                        accountsPool = matchedAccounts
                    }
                }
            }

            // Sticky Sender Logic (Try to use same account for follow-ups)
            if (nextStepNumber > 1 && previousEvent && previousEvent.emailAccountId) {
                const stickyAccount = accountsPool.find((a: any) => a.id === previousEvent!.emailAccountId)
                if (stickyAccount) {
                    account = stickyAccount
                } else {
                    const accountIndex = campaign.lastAccountIndex || 0
                    account = accountsPool[accountIndex % accountsPool.length]
                }
            } else {
                const accountIndex = campaign.lastAccountIndex || 0
                account = accountsPool[accountIndex % accountsPool.length]

                await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { lastAccountIndex: (accountIndex + 1) % availableAccounts.length }
                })
            }

            try {
                // Ensure Unsubscribe Token exists on Lead
                if (!lead.unsubscribeToken) {
                    const token = `${lead.id}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { unsubscribeToken: token }
                    })
                    lead.unsubscribeToken = token
                }

                // Select Variant
                let subject = ""
                let body = ""
                let selectedVariantId = ""
                // @ts-ignore
                const variants = ((step as any).variants || []).filter((v: any) => v.enabled !== false)

                if (variants && variants.length > 0) {
                    let chosenVariant = variants[Math.floor(Math.random() * variants.length)]

                    // Instantly.ai Style Auto-Optimize A/Z Testing Logic
                    if (settings.autoOptimizeAZ && settings.winningMetric && variants.length > 1) {
                        try {
                            const minSamplePerVariant = 10 // Minimum sends before auto-optimizing

                            const variantStats = await Promise.all(variants.map(async (v: any) => {
                                const sentEventsForVariant = await prisma.sendingEvent.findMany({
                                    where: {
                                        campaignId: campaign.id,
                                        type: 'sent',
                                        metadata: { contains: `"variantId":"${v.id}"` }
                                    },
                                    select: { leadId: true }
                                })

                                const totalSent = sentEventsForVariant.length
                                if (totalSent < minSamplePerVariant) {
                                    return { variant: v, score: 0, sent: totalSent, rate: 0 }
                                }

                                const leadIds = sentEventsForVariant.map((e: any) => e.leadId)
                                const metric = (settings.winningMetric || '').toLowerCase()

                                let positiveEvents = 0
                                if (metric === 'reply rate' || metric === 'replies') {
                                    positiveEvents = await prisma.lead.count({
                                        where: {
                                            id: { in: leadIds },
                                            status: 'replied'
                                        }
                                    })
                                } else if (metric === 'open rate' || metric === 'opens') {
                                    positiveEvents = await prisma.sendingEvent.count({
                                        where: {
                                            campaignId: campaign.id,
                                            type: 'open',
                                            leadId: { in: leadIds }
                                        }
                                    })
                                } else if (metric === 'click rate' || metric === 'clicks') {
                                    positiveEvents = await prisma.sendingEvent.count({
                                        where: {
                                            campaignId: campaign.id,
                                            type: 'click',
                                            leadId: { in: leadIds }
                                        }
                                    })
                                }

                                const rate = totalSent > 0 ? positiveEvents / totalSent : 0
                                return { variant: v, score: rate, sent: totalSent, rate }
                            }))

                            // Check if all variants have met minimum sample size to start exploitation
                            const readyVariants = variantStats.filter((s: any) => s.sent >= minSamplePerVariant)

                            if (readyVariants.length > 0) {
                                const maxScoreStat = readyVariants.reduce((max: any, current: any) => current.score > max.score ? current : max, readyVariants[0])

                                if (maxScoreStat && maxScoreStat.score > 0) {
                                    // 80% Exploitation of current winner, 20% Continuous Exploration of other variants
                                    if (Math.random() < 0.8) {
                                        chosenVariant = maxScoreStat.variant
                                    } else {
                                        // Pick from remaining variants so lagging variants still receive traffic and can overtake
                                        const otherVariants = variants.filter((v: any) => v.id !== maxScoreStat.variant.id)
                                        if (otherVariants.length > 0) {
                                            chosenVariant = otherVariants[Math.floor(Math.random() * otherVariants.length)]
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`[Sender] Failed to auto-optimize variant for step ${step.id}`, e)
                        }
                    }

                    // @ts-ignore
                    subject = chosenVariant.subject || ""
                    // @ts-ignore
                    body = chosenVariant.body
                    selectedVariantId = chosenVariant.id;
                    // Extract attachments for the chosen variant
                    ; (step as any).mailAttachments = (chosenVariant.attachments || []).map((a: any) => ({
                        filename: a.filename,
                        content: a.content,
                        contentType: a.mimeType
                    }))
                } else {
                    // @ts-ignore
                    subject = step.subject || ""
                    // @ts-ignore
                    body = step.body || ""
                }

                if (!subject && !body) continue

                // Replace Variables
                subject = replaceVariables(subject, lead, account)
                body = replaceVariables(body, lead, account)

                // Create Sending Event
                const sentEvent = await prisma.sendingEvent.create({
                    data: {
                        type: 'pending',
                        campaignId: campaign.id,
                        leadId: lead.id,
                        emailAccountId: account.id,
                        metadata: JSON.stringify({ accountId: account.id, subject, step: nextStepNumber, variantId: selectedVariantId })
                    }
                })

                // Construct Email Body (Text vs HTML)
                let finalHtml: string | undefined = `${body}`

                if (finalHtml) {
                    const isRichHtml = /<(p|div|table|ul|ol|h[1-6])\b/i.test(finalHtml)

                    if (!isRichHtml) {
                        finalHtml = finalHtml.replace(/\n/g, '<br />')
                    }

                    finalHtml = finalHtml.replace(/<p\b[^>]*>/gi, '<p style="margin: 0; padding: 0; padding-bottom: 12px; line-height: 24px; mso-line-height-rule: exactly; mso-margin-bottom-alt: 12px;">')
                    finalHtml = finalHtml.replace(/<div\b[^>]*>/gi, '<div style="line-height: 24px; mso-line-height-rule: exactly;">')
                    finalHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 24px; mso-line-height-rule: exactly; color: #000000; font-size: 15px;">${finalHtml}</div>`
                }

                let finalText: string | undefined = undefined

                // Check Text-Only Settings
                const isTextOnly = settings.sendAsTextOnly || (settings.sendFirstAsText && nextStepNumber === 1)

                if (isTextOnly) {
                    finalText = body.replace(/<[^>]*>/g, '')
                    
                    if (campaign.trackLinks) {
                        const urlRegex = /(https?:\/\/[^\s"'<]+)/g
                        finalText = finalText.replace(urlRegex, (url) => {
                            const trackingUrl = `${BASE_URL}/api/track/click?eid=${sentEvent.id}&url=${encodeURIComponent(url)}`
                            return trackingUrl
                        })
                    }

                    finalHtml = undefined
                } else {
                    if (campaign.trackOpens || campaign.trackLinks) {
                        finalHtml = injectTracking(finalHtml!, sentEvent.id, BASE_URL, campaign.trackLinks, campaign.trackOpens)
                    }
                }

                const smtpDefaults = getSmtpDefaults(account.provider)
                const smtpHost = account.smtpHost || smtpDefaults?.host
                const smtpPort = account.smtpPort || smtpDefaults?.port || 587

                if (!smtpHost) {
                    throw new Error(`No SMTP host configured for ${account.email} (provider: ${account.provider}). Please update the account settings.`)
                }

                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpPort === 465,
                    auth: { user: account.smtpUser || account.email, pass: account.smtpPass! }
                })

                const senderName = `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.email
                const mailOptions: any = {
                    from: `"${senderName}" <${account.email}>`,
                    to: lead.email,
                    subject: subject,
                    html: finalHtml,
                    text: finalText,
                    attachments: (step as any).mailAttachments || [],
                    cc: settings.ccRecipients,
                    bcc: settings.bccRecipients
                }

                const headers: Record<string, string> = {}

                // Threading
                if (nextStepNumber > 1 && previousEvent && previousEvent.messageId) {
                    headers['In-Reply-To'] = previousEvent.messageId
                    headers['References'] = previousEvent.messageId
                }

                // RFC One-Click Unsubscribe Header (Gmail & Yahoo 2024 compliance)
                if (settings.insertUnsubscribeHeader && lead.unsubscribeToken) {
                    const unsubUrl = `${BASE_URL}/api/unsubscribe?token=${lead.unsubscribeToken}`
                    headers['List-Unsubscribe'] = `<${unsubUrl}>`
                    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
                }

                if (Object.keys(headers).length > 0) {
                    mailOptions.headers = headers
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
                        data: { type: 'sent', messageId, details: finalHtml || finalText }
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
                        where: { campaignId_date: { campaignId: campaign.id, date: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z') } },
                        create: { campaignId: campaign.id, date: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'), sent: 1 },
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
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { status: 'sequence_complete', nextSendAt: null }
                    })
                }

                totalSent++
                sentForThisCampaign++
                if (nextStepNumber === 1) newLeadsSentToday++
                console.log(`Sent Step ${nextStepNumber} to ${lead.email} via ${account.email}`)

                // Small 500ms safety yield between sequential sends in the same batch
                await new Promise(resolve => setTimeout(resolve, 500))

            } catch (error: any) {
                console.error(`Failed to send to ${lead.email}`, error)
                errors++

                const errorMessage = error.message || 'Unknown SMTP error'
                // Handle Google's specifically shifting "Daily user sending quota" and "Daily user sending limit" outputs
                const isDailyLimitError = errorMessage.includes('550 5.4.5') || errorMessage.includes('Daily user sending quota exceeded') || errorMessage.includes('Daily user sending limit exceeded')

                if (isDailyLimitError) {
                    const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
                    const countBeforeQuota = await prisma.sendingEvent.count({
                        where: {
                            emailAccountId: account.id,
                            type: 'sent',
                            createdAt: { gte: todayUTC },
                            metadata: { contains: '"step":' }
                        }
                    })

                    console.warn(`[Sender] ⚠️ Account ${account.email} hit provider daily limit. Quota reached after ${countBeforeQuota} email(s) sent today. Pausing account until tomorrow.`)
                    
                    await prisma.emailAccount.update({
                        where: { id: account.id },
                        data: {
                            sentToday: countBeforeQuota,
                            errorDetail: `Daily provider quota reached after ${countBeforeQuota} email(s) sent today. Auto-resumes tomorrow.`
                        }
                    }).catch((e: any) => console.error('Failed to update account limit status', e))
                } else {
                    // Log error to the account to surface in UI
                    await prisma.emailAccount.update({
                        where: { id: account.id },
                        data: {
                            status: 'error',
                            errorDetail: `Sending failed: ${errorMessage}`
                        }
                    }).catch((e: any) => console.error('Failed to update account error status', e))
                }
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
