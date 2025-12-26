import { prisma } from './prisma'
import nodemailer from 'nodemailer'

/**
 * Warmup Pool System
 * 
 * The warmup pool is a network of email accounts from different users
 * that participate in mutual warmup. This creates a more authentic
 * warmup experience as emails are exchanged between different domains
 * and organizations.
 */

interface PoolMember {
    id: string
    email: string
    domain: string
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    firstName: string
    lastName: string
    warmupScore: number // Reputation score in the pool
    lastActive: Date
}

// Warmup email templates for pool exchanges
const POOL_TEMPLATES = [
    {
        type: 'business',
        subjects: [
            'Partnership opportunity',
            'Quick sync on project timeline',
            'Q4 planning discussion',
            'Resource allocation update',
            'Meeting notes from yesterday'
        ],
        bodies: [
            'Hi,\n\nI wanted to follow up on our discussion. Let me know when you have a moment to chat.\n\nBest regards',
            'Hello,\n\nJust checking in on the status of the project. Any updates you can share?\n\nThanks',
            'Hi there,\n\nHope you\'re doing well! I\'ve attached the documents we discussed.\n\nCheers',
            'Good morning,\n\nWanted to touch base on the timeline. Are we still on track?\n\nBest',
            'Hi,\n\nThank you for your patience. I\'ll have the report ready by end of day.\n\nRegards'
        ]
    },
    {
        type: 'casual',
        subjects: [
            'Coffee chat this week?',
            'Great meeting you!',
            'Following up',
            'Quick question',
            'Thanks for connecting'
        ],
        bodies: [
            'Hey!\n\nGreat chatting with you earlier. Let\'s grab coffee sometime soon.\n\nCheers',
            'Hi!\n\nWanted to say thanks for the intro. Really appreciate it!\n\nBest',
            'Hey there,\n\nJust following up on our conversation. Let me know your thoughts.\n\nTalk soon',
            'Hi,\n\nHope you\'re having a great week! Any updates on your end?\n\nBest',
            'Hello!\n\nQuick question - did you get a chance to review the proposal?\n\nThanks'
        ]
    }
]

/**
 * Get available pool members for warmup exchange
 * Prioritizes accounts from different domains for authenticity
 */
export async function getPoolMembers(excludeAccountId: string, limit: number = 10): Promise<PoolMember[]> {
    try {
        const members = await prisma.emailAccount.findMany({
            where: {
                id: { not: excludeAccountId },
                warmupEnabled: true,
                warmupPoolOptIn: true, // Account opted into the pool
                status: 'active'
            },
            orderBy: [
                { warmupScore: 'desc' },
                { lastActive: 'desc' }
            ],
            take: limit * 2 // Get extra for domain diversification
        })

        // Prioritize diverse domains
        const domainMap = new Map<string, any[]>()
        for (const member of members) {
            const domain = member.email.split('@')[1]
            if (!domainMap.has(domain)) {
                domainMap.set(domain, [])
            }
            domainMap.get(domain)!.push(member)
        }

        // Round-robin selection from different domains
        const selected: PoolMember[] = []
        const domains = Array.from(domainMap.keys())
        let domainIndex = 0

        while (selected.length < limit && domains.length > 0) {
            const domain = domains[domainIndex % domains.length]
            const domainMembers = domainMap.get(domain)!

            if (domainMembers.length > 0) {
                const member = domainMembers.shift()!
                selected.push({
                    id: member.id,
                    email: member.email,
                    domain,
                    smtpHost: member.smtpHost || '',
                    smtpPort: member.smtpPort || 587,
                    smtpUser: member.smtpUser || member.email,
                    smtpPass: member.smtpPass || '',
                    firstName: member.firstName || '',
                    lastName: member.lastName || '',
                    warmupScore: member.warmupScore || 100,
                    lastActive: member.lastActive || new Date()
                })
            } else {
                domains.splice(domains.indexOf(domain), 1)
            }
            domainIndex++
        }

        return selected
    } catch (error) {
        console.error('Failed to get pool members:', error)
        return []
    }
}

/**
 * Send warmup email through the pool
 */
export async function sendPoolWarmupEmail(
    sender: PoolMember,
    receiver: PoolMember
): Promise<boolean> {
    try {
        const transporter = nodemailer.createTransport({
            host: sender.smtpHost,
            port: sender.smtpPort,
            secure: sender.smtpPort === 465,
            auth: { user: sender.smtpUser, pass: sender.smtpPass }
        })

        // Select random template type and content
        const templateType = POOL_TEMPLATES[Math.floor(Math.random() * POOL_TEMPLATES.length)]
        const subject = templateType.subjects[Math.floor(Math.random() * templateType.subjects.length)]
        const body = templateType.bodies[Math.floor(Math.random() * templateType.bodies.length)]

        const warmupId = `pool_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const senderName = `${sender.firstName} ${sender.lastName}`.trim() || sender.email.split('@')[0]

        await transporter.sendMail({
            from: `"${senderName}" <${sender.email}>`,
            to: receiver.email,
            subject,
            text: body + `\n\n${senderName}`,
            html: (body + `\n\n${senderName}`).replace(/\n/g, '<br>'),
            headers: {
                'X-Instantly-Warmup': 'true',
                'X-Warmup-ID': warmupId,
                'X-Warmup-Pool': 'true',
                'X-Warmup-Sender-Domain': sender.domain,
                'X-Warmup-Receiver-Domain': receiver.domain
            }
        })

        console.log(`🌐 Pool warmup: ${sender.email} -> ${receiver.email}`)

        // Update sender stats
        await prisma.emailAccount.update({
            where: { id: sender.id },
            data: {
                warmupSentToday: { increment: 1 },
                lastActive: new Date()
            }
        }).catch(() => { })

        // Log pool exchange
        await prisma.warmupLog.create({
            data: {
                accountId: sender.id,
                action: 'pool_send',
                warmupId,
                fromEmail: sender.email,
                toEmail: receiver.email,
                details: `Pool warmup to ${receiver.domain}`
            }
        }).catch(() => { })

        return true
    } catch (error) {
        console.error(`Pool warmup failed ${sender.email} -> ${receiver.email}:`, error)

        // Decrease warmup score on failure
        await prisma.emailAccount.update({
            where: { id: sender.id },
            data: { warmupScore: { decrement: 1 } }
        }).catch(() => { })

        return false
    }
}

/**
 * Run pool warmup cycle
 * Each participating account sends to and receives from pool members
 */
export async function runPoolWarmupCycle(): Promise<{ sent: number, errors: number }> {
    let sent = 0
    let errors = 0

    try {
        // Get all accounts opted into the pool
        const participants = await prisma.emailAccount.findMany({
            where: {
                warmupEnabled: true,
                warmupPoolOptIn: true,
                status: 'active'
            }
        })

        console.log(`🌐 Pool warmup: ${participants.length} participants`)

        for (const account of participants) {
            // Check daily limit
            if ((account.warmupSentToday || 0) >= (account.warmupMaxPerDay || 10)) {
                continue
            }

            // Get pool members to send to (different domains preferred)
            const poolMembers = await getPoolMembers(account.id, 3)

            for (const member of poolMembers) {
                const sender: PoolMember = {
                    id: account.id,
                    email: account.email,
                    domain: account.email.split('@')[1],
                    smtpHost: account.smtpHost || '',
                    smtpPort: account.smtpPort || 587,
                    smtpUser: account.smtpUser || account.email,
                    smtpPass: account.smtpPass || '',
                    firstName: account.firstName || '',
                    lastName: account.lastName || '',
                    warmupScore: account.warmupScore || 100,
                    lastActive: account.lastActive || new Date()
                }

                const success = await sendPoolWarmupEmail(sender, member)
                if (success) {
                    sent++
                } else {
                    errors++
                }

                // Rate limiting - wait between sends
                await new Promise(r => setTimeout(r, 2000))
            }
        }
    } catch (error) {
        console.error('Pool warmup cycle failed:', error)
    }

    return { sent, errors }
}

/**
 * Calculate and update warmup reputation scores
 */
export async function updateWarmupScores(): Promise<void> {
    try {
        const accounts = await prisma.emailAccount.findMany({
            where: { warmupPoolOptIn: true }
        })

        for (const account of accounts) {
            // Factors affecting warmup score:
            // + Emails sent successfully
            // + Replies received
            // + Low bounce rate
            // - Spam complaints
            // - Connection errors

            const newScore = Math.min(100, Math.max(0,
                (account.warmupScore || 100) +
                ((account.warmupSentToday || 0) * 0.1) -
                ((account.bounceCount || 0) * 2)
            ))

            await prisma.emailAccount.update({
                where: { id: account.id },
                data: { warmupScore: newScore }
            })
        }
    } catch (error) {
        console.error('Failed to update warmup scores:', error)
    }
}

/**
 * Opt account into/out of the warmup pool
 */
export async function setPoolOptIn(accountId: string, optIn: boolean): Promise<boolean> {
    try {
        await prisma.emailAccount.update({
            where: { id: accountId },
            data: {
                warmupPoolOptIn: optIn,
                warmupScore: optIn ? 100 : 0 // Reset score on opt-in
            }
        })
        return true
    } catch (error) {
        console.error('Failed to update pool opt-in:', error)
        return false
    }
}
