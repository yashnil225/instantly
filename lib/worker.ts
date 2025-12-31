import { Worker } from 'bullmq'
import { prisma } from './prisma'
import { sendEmail } from './email'
import { canSendNow, getNextSendTime } from './scheduler'
import { selectVariant } from './ab-testing'

const getRedisConnection = () => {
    const redisUrl = process.env.REDIS_URL
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction && !redisUrl) {
        return null
    }

    return redisUrl ? redisUrl : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    }
}

export const startWorker = () => {
    // Skip if not in node runtime or during build
    if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NEXT_PHASE === 'phase-production-build') return

    console.log('[Worker] Starting email worker...')
    const connection = getRedisConnection()

    if (!connection) {
        console.warn('[Worker] Skipping initialization: No Redis connection available.')
        return
    }

    try {
        const emailWorker = new Worker('email-sending', async (job) => {
            const { campaignId, leadId, sequenceId, emailBody, subject } = job.data

            console.log(`Processing job ${job.id}: Sending email to lead ${leadId} for campaign ${campaignId}`)

            try {
                // 1. Fetch Lead and Campaign details with Accounts
                const campaign = await prisma.campaign.findUnique({
                    where: { id: campaignId },
                    include: {
                        campaignAccounts: {
                            include: {
                                emailAccount: true
                            }
                        },
                        sequences: {
                            where: { id: sequenceId },
                            orderBy: { stepNumber: 'asc' }
                        }
                    }
                })

                const lead = await prisma.lead.findUnique({ where: { id: leadId } })

                if (!lead || !campaign) {
                    throw new Error('Lead or Campaign not found')
                }

                if (!campaign.campaignAccounts || campaign.campaignAccounts.length === 0) {
                    throw new Error('No email accounts assigned to this campaign')
                }

                // 2. Check Schedule - Can we send now?
                const scheduleConfig = {
                    timezone: campaign.timezone,
                    startTime: campaign.startTime,
                    endTime: campaign.endTime,
                    days: campaign.days
                }

                if (!canSendNow(scheduleConfig)) {
                    const nextTime = getNextSendTime(scheduleConfig)
                    console.log(`Outside sending window. Rescheduling for ${nextTime}`)
                    // Reschedule the job
                    throw new Error(`Outside schedule window. Next send time: ${nextTime}`)
                }

                // 3. Select Email Account with Daily Limit Check
                let selectedAccount = null
                const accounts = campaign.campaignAccounts.map(ca => ca.emailAccount)

                for (const account of accounts) {
                    // Check account daily limit
                    if (account.sentToday >= account.dailyLimit) {
                        console.log(`Account ${account.email} has reached daily limit (${account.dailyLimit})`)
                        continue
                    }

                    // Check account status
                    if (account.status !== 'active') {
                        console.log(`Account ${account.email} is not active (status: ${account.status})`)
                        continue
                    }

                    selectedAccount = account
                    break
                }

                if (!selectedAccount) {
                    throw new Error('No available email accounts (all reached daily limits or inactive)')
                }

                // Check campaign daily limit
                if (campaign.dailyLimit) {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)

                    const todayStats = await prisma.campaignStat.findUnique({
                        where: { campaignId_date: { campaignId: campaign.id, date: today } }
                    })

                    if (todayStats && todayStats.sent >= campaign.dailyLimit) {
                        throw new Error(`Campaign has reached daily limit (${campaign.dailyLimit})`)
                    }
                }

                // 4. A/B Testing - Select Variant
                let finalSubject = subject
                let finalBody = emailBody

                if (campaign.sequences && campaign.sequences.length > 1) {
                    // Multiple variants exist for this step
                    const variants = campaign.sequences.map(seq => ({
                        id: seq.id,
                        subject: seq.subject || '',
                        body: seq.body || ''
                    }))

                    const selectedVariant = selectVariant(variants)
                    finalSubject = selectedVariant.subject
                    finalBody = selectedVariant.body

                    console.log(`A/B Test: Selected variant with subject "${finalSubject.substring(0, 30)}..."`)
                }

                // 5. Personalize Email - Replace ALL lead variables dynamically
                const replaceVariables = (text: string) => {
                    let result = text

                    // Core lead fields
                    if (lead.firstName) result = result.replace(/\{\{firstName\}\}/g, lead.firstName)
                    if (lead.lastName) result = result.replace(/\{\{lastName\}\}/g, lead.lastName)
                    if (lead.company) result = result.replace(/\{\{company\}\}/g, lead.company)
                    if (lead.email) result = result.replace(/\{\{email\}\}/g, lead.email)

                    // Parse customFields if they exist (stored as JSON)
                    let customFields: Record<string, string> = {}
                    const leadWithCustom = lead as any
                    if (leadWithCustom.customFields) {
                        try {
                            customFields = typeof leadWithCustom.customFields === 'string'
                                ? JSON.parse(leadWithCustom.customFields)
                                : leadWithCustom.customFields
                        } catch (e) {
                            console.error('Failed to parse custom fields:', e)
                        }
                    }

                    // Replace custom field variables (e.g., {{website}}, {{location}}, {{phone}}, etc.)
                    for (const [key, value] of Object.entries(customFields)) {
                        if (value) {
                            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
                        }
                    }

                    // Remove any remaining empty/unused variables (clean up)
                    result = result.replace(/\{\{[^}]+\}\}/g, '')

                    return result
                }

                finalSubject = replaceVariables(finalSubject)
                finalBody = replaceVariables(finalBody)

                // 6. Prepare Email Content with Tracking
                const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

                // Generate unsubscribe token if not exists
                if (!lead.unsubscribeToken) {
                    const token = `${lead.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { unsubscribeToken: token }
                    })
                    lead.unsubscribeToken = token
                }

                // Inject Open Tracking Pixel
                if (campaign.trackOpens) {
                    const pixelUrl = `${baseUrl}/api/track/open?lid=${lead.id}&cid=${campaign.id}`
                    finalBody += `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`
                }

                // Inject Link Tracking
                if (campaign.trackLinks) {
                    finalBody = finalBody.replace(/href=["'](http[^"']+)["']/g, (match: string, url: string) => {
                        const trackUrl = `${baseUrl}/api/track/click?lid=${lead.id}&cid=${campaign.id}&url=${encodeURIComponent(url)}`
                        return `href="${trackUrl}"`
                    })
                }

                // Inject Unsubscribe Link
                const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${lead.unsubscribeToken}`
                const unsubscribeFooter = `
                <br><br>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #999; text-align: center;">
                    If you no longer wish to receive these emails, you can 
                    <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">unsubscribe here</a>.
                </p>
            `
                finalBody += unsubscribeFooter

                // 7. Send Email
                const messageId = `<${Date.now()}.${lead.id}@${selectedAccount.email.split('@')[1]}>`

                await sendEmail({
                    config: {
                        host: selectedAccount.smtpHost || 'smtp.gmail.com',
                        port: selectedAccount.smtpPort || 587,
                        user: selectedAccount.smtpUser || selectedAccount.email,
                        pass: selectedAccount.smtpPass || '',
                    },
                    to: lead.email,
                    subject: finalSubject,
                    html: finalBody,
                    fromName: `${selectedAccount.firstName || ''} ${selectedAccount.lastName || ''}`.trim() || selectedAccount.email,
                    fromEmail: selectedAccount.email,
                })

                // 8. Log the sent email
                await prisma.sendingEvent.create({
                    data: {
                        type: 'sent',
                        leadId: lead.id,
                        campaignId: campaign.id,
                        metadata: JSON.stringify({
                            from: selectedAccount.email,
                            messageId: messageId,
                            subject: finalSubject,
                            variant: sequenceId
                        })
                    }
                })

                // 9. Update counters
                await prisma.lead.update({
                    where: { id: leadId },
                    data: { status: 'contacted' }
                })

                // Update account sent counter
                await prisma.emailAccount.update({
                    where: { id: selectedAccount.id },
                    data: { sentToday: { increment: 1 } }
                })

                // Update campaign stats
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                await prisma.campaignStat.upsert({
                    where: { campaignId_date: { campaignId: campaign.id, date: today } },
                    create: { campaignId: campaign.id, date: today, sent: 1 },
                    update: { sent: { increment: 1 } }
                })

                await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { sentCount: { increment: 1 } }
                })

                console.log(`✅ Email sent to ${lead.email} from ${selectedAccount.email} (${selectedAccount.sentToday + 1}/${selectedAccount.dailyLimit})`)

            } catch (error) {
                console.error(`Failed to send email for job ${job.id}:`, error)
                throw error
            }
        }, { connection: connection as any })

        emailWorker.on('error', (err) => {
            console.warn('[QueueWorker] Redis connection error:', err.message)
        })

        emailWorker.on('completed', (job) => {
            console.log(`Job ${job?.id || 'unknown'} has completed!`)
        })

        emailWorker.on('failed', (job, err) => {
            console.log(`Job ${job?.id || 'unknown'} has failed with ${err.message}`)
        })
    } catch (e: any) {
        console.warn('[QueueWorker] Could not initialize (Redis missing?):', e.message)
    }
}
