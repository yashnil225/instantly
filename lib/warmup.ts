import { prisma } from './prisma'
import { sendEmail } from './email'

interface WarmupConfig {
    startLimit: number      // Start with this many emails per day
    maxLimit: number        // Max emails per day after warmup
    increasePerDay: number  // How many to increase daily
    replyRate: number       // Target reply rate (%)
}

const DEFAULT_CONFIG: WarmupConfig = {
    startLimit: 10,
    maxLimit: 50,
    increasePerDay: 5,
    replyRate: 30
}

export function calculateWarmupLimit(account: any): number {
    if (!account.warmupEnabled) {
        return account.dailyLimit || 50
    }

    // Use account's configured warmup settings
    const startLimit = 1  // Start with 1 email on day 1 (Satisfies user request for odd start)
    const dailyIncrease = account.warmupDailyIncrease || 1  // Increase per day from account settings
    const maxLimit = account.warmupDailyLimit || 50  // Max limit from account settings

    // Get current warmup day (how many days since warmup started)
    const currentDay = account.warmupCurrentDay || 1

    // Calculate current warmup limit: starts at 1, increases by dailyIncrease each day
    const calculatedLimit = startLimit + ((currentDay - 1) * dailyIncrease)

    // Cap at the account's warmupDailyLimit
    return Math.min(calculatedLimit, maxLimit)
}

export async function sendWarmupEmails() {
    // Get all accounts with warmup enabled
    const accounts = await prisma.emailAccount.findMany({
        where: {
            warmupEnabled: true,
            status: 'active'
        }
    })

    console.log(`Sending warmup emails for ${accounts.length} accounts`)

    if (accounts.length < 2) {
        console.log('Skipping warmup: At least 2 active warmup accounts are required for internal exchange.')
        return
    }

    for (const account of accounts) {
        try {
            const warmupLimit = calculateWarmupLimit(account)
            const alreadySent = account.warmupSentToday

            if (alreadySent >= warmupLimit) {
                console.log(`${account.email}: Warmup limit reached (${alreadySent}/${warmupLimit})`)
                continue
            }

            // Send warmup emails to other accounts in the system
            const otherAccounts = await prisma.emailAccount.findMany({
                where: {
                    id: { not: account.id },
                    warmupEnabled: true
                },
                take: warmupLimit - alreadySent
            })

            for (const recipient of otherAccounts) {
                await sendWarmupEmail(account, recipient)

                // Update warmup sent count
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { warmupSentToday: { increment: 1 } }
                })
            }

            console.log(`${account.email}: Sent ${otherAccounts.length} warmup emails`)
        } catch (error) {
            console.error(`Warmup failed for ${account.email}:`, error)
        }
    }
}

async function sendWarmupEmail(from: any, to: any) {
    const subjects = [
        'Quick check-in',
        'Following up',
        'Touching base',
        'Hope you\'re doing well',
        'Quick question'
    ]

    const bodies = [
        `Hi there,\n\nJust wanted to check in and see how things are going.\n\nBest regards,\n${from.firstName || 'Team'}`,
        `Hello,\n\nHope you're having a great day!\n\nCheers,\n${from.firstName || 'Team'}`,
        `Hi,\n\nJust following up on our previous conversation.\n\nThanks,\n${from.firstName || 'Team'}`
    ]

    const subject = subjects[Math.floor(Math.random() * subjects.length)]
    const body = bodies[Math.floor(Math.random() * bodies.length)]

    await sendEmail({
        config: {
            host: from.smtpHost || 'smtp.gmail.com',
            port: from.smtpPort || 587,
            user: from.smtpUser || from.email,
            pass: from.smtpPass || ''
        },
        to: to.email,
        subject,
        html: body.replace(/\n/g, '<br>'),
        fromName: `${from.firstName || ''} ${from.lastName || ''}`.trim() || from.email,
        fromEmail: from.email
    })
}

// Reset daily counters at midnight
export async function resetDailyCounters() {
    await prisma.emailAccount.updateMany({
        data: {
            sentToday: 0,
            warmupSentToday: 0
        }
    })
    console.log('Daily counters reset')
}
