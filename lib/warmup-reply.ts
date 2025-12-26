import nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface SmtpConfig {
    host: string
    port: number
    user: string
    pass: string
}

// Warmup reply templates - varied and natural-sounding
const REPLY_TEMPLATES = [
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Hi ${senderName},\n\nThanks for reaching out! I'll review this and get back to you shortly.\n\nBest regards`
    },
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Hey ${senderName},\n\nGot it, thanks for the update!\n\nCheers`
    },
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Hi ${senderName},\n\nAppreciate you sending this over. Looks good to me!\n\nTalk soon`
    },
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Thanks ${senderName}!\n\nI'll take a look at this today and circle back.\n\nBest`
    },
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Hi ${senderName},\n\nPerfect, this is exactly what I needed. Thanks for following up!\n\nRegards`
    },
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Hey,\n\nSounds good! Let's touch base on this later this week.\n\nThanks,`
    },
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Hi ${senderName},\n\nGreat, I've noted this down. Will discuss with the team.\n\nBest regards`
    },
    {
        subject: (original: string) => `Re: ${original}`,
        body: (senderName: string) => `Thanks for the heads up, ${senderName}!\n\nI'll review and let you know if I have any questions.\n\nCheers`
    }
]

/**
 * Generate a natural auto-reply for warmup emails
 */
function generateReply(originalSubject: string, senderName: string, replyerName: string): { subject: string, body: string } {
    const template = REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)]

    // Add random delay text variations
    const delayTexts = ['', ' ']
    const delayText = delayTexts[Math.floor(Math.random() * delayTexts.length)]

    return {
        subject: template.subject(originalSubject),
        body: template.body(senderName) + `\n${replyerName}${delayText}`
    }
}

/**
 * Send auto-reply to a warmup email
 */
export async function sendWarmupReply(
    replierAccount: any,
    originalEmail: {
        from: string
        subject: string
        warmupId: string
        messageId?: string
    }
): Promise<boolean> {
    const config: SmtpConfig = {
        host: replierAccount.smtpHost || 'smtp.gmail.com',
        port: replierAccount.smtpPort || 587,
        user: replierAccount.smtpUser || replierAccount.email,
        pass: replierAccount.smtpPass || ''
    }

    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: { user: config.user, pass: config.pass }
        })

        // Extract sender name from email
        const senderName = originalEmail.from.split('<')[0].trim() || 'there'
        const replierName = `${replierAccount.firstName || ''} ${replierAccount.lastName || ''}`.trim() || replierAccount.email.split('@')[0]

        const { subject, body } = generateReply(originalEmail.subject, senderName, replierName)

        // Add random delay (1-5 minutes equivalent in human behavior)
        const randomDelay = Math.floor(Math.random() * 4 * 60 * 1000) + 60000
        await new Promise(resolve => setTimeout(resolve, Math.min(randomDelay, 5000))) // Cap at 5s for cron

        await transporter.sendMail({
            from: `"${replierName}" <${replierAccount.email}>`,
            to: originalEmail.from,
            subject,
            text: body,
            html: body.replace(/\n/g, '<br>'),
            headers: {
                'X-Instantly-Warmup': 'true',
                'X-Warmup-ID': `reply_${originalEmail.warmupId}`,
                'X-Warmup-Reply-To': originalEmail.warmupId,
                ...(originalEmail.messageId ? { 'In-Reply-To': originalEmail.messageId, 'References': originalEmail.messageId } : {})
            }
        })

        console.log(`↩️ Warmup reply sent: ${replierAccount.email} -> ${originalEmail.from}`)

        // Log the reply
        try {
            await prisma.warmupLog.create({
                data: {
                    accountId: replierAccount.id,
                    action: 'auto_reply',
                    warmupId: originalEmail.warmupId,
                    fromEmail: replierAccount.email,
                    toEmail: originalEmail.from,
                    details: `Auto-replied to warmup email: ${originalEmail.subject}`
                }
            })
        } catch {
            // Table may not exist
        }

        // Update reply stats
        try {
            await prisma.emailAccount.update({
                where: { id: replierAccount.id },
                data: { warmupRepliedToday: { increment: 1 } }
            })
        } catch {
            // Field may not exist
        }

        return true
    } catch (error) {
        console.error(`Warmup reply failed for ${replierAccount.email}:`, error)
        return false
    }
}

/**
 * Process incoming warmup emails and auto-reply
 */
export async function processWarmupReplies(account: any, warmupEmails: any[]): Promise<number> {
    let repliedCount = 0

    for (const email of warmupEmails) {
        // Check if we already replied to this warmup ID
        try {
            const existingReply = await prisma.warmupLog.findFirst({
                where: {
                    accountId: account.id,
                    action: 'auto_reply',
                    warmupId: email.warmupId
                }
            })

            if (existingReply) {
                console.log(`Already replied to warmup: ${email.warmupId}`)
                continue
            }
        } catch {
            // Table may not exist, proceed anyway
        }

        // Don't reply to our own replies
        if (email.warmupId.startsWith('reply_')) {
            continue
        }

        const success = await sendWarmupReply(account, email)
        if (success) repliedCount++
    }

    return repliedCount
}
