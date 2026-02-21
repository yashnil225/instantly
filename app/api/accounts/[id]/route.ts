import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateWarmupLimit } from '@/lib/warmup'


// GET - Fetch single account with warmup stats
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const account = await prisma.emailAccount.findUnique({
            where: { id },
            include: {
                warmupLogs: {
                    where: {
                        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                // Include campaigns that use this email account
                campaignAccounts: {
                    include: {
                        campaign: {
                            select: {
                                id: true,
                                name: true,
                                status: true
                            }
                        }
                    }
                }
            }
        })

        if (!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 })
        }

        // Calculate warmup stats from logs
        const warmupStats = {
            received: account.warmupLogs.filter(l => l.action === "receive" || l.action === "pool_receive").length,
            sent: account.warmupLogs.filter(l => l.action === "send" || l.action === "pool_send").length,
            savedFromSpam: account.warmupLogs.filter(l => l.action === "spam_rescue").length
        }

        // Get daily warmup data for chart
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dailyData: Record<string, number> = {}

        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            dailyData[days[date.getDay()]] = 0
        }

        account.warmupLogs.forEach(log => {
            if (log.action === "send" || log.action === "pool_send") {
                const dayName = days[log.createdAt.getDay()]
                if (dailyData[dayName] !== undefined) {
                    dailyData[dayName]++
                }
            }
        })

        const chartData = Object.entries(dailyData).map(([day, sent]) => ({ day, sent }))

        // Calculate warmup start date
        const warmupStarted = account.warmupLogs.length > 0
            ? account.warmupLogs[account.warmupLogs.length - 1].createdAt
            : account.createdAt

        // Extract campaigns from the join table
        const campaigns = account.campaignAccounts.map(ca => ca.campaign)

        return NextResponse.json({
            ...account,
            warmupStats,
            chartData,
            warmupStarted,
            campaigns,
            warmupLogs: undefined, // Don't send raw logs
            campaignAccounts: undefined // Don't send raw join data
        })
    } catch (error) {
        console.error("Failed to fetch account:", error)
        return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 })
    }
}

// PATCH - Update account
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        // Fetch existing account first (needed for verification and partial updates)
        const accountBefore = await prisma.emailAccount.findUnique({ where: { id } })
        if (!accountBefore) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }

        // Build update data, only including fields that are provided
        const updateData: any = {}

        // Basic info
        if (body.firstName !== undefined) updateData.firstName = body.firstName
        if (body.lastName !== undefined) updateData.lastName = body.lastName
        if (body.signature !== undefined) updateData.signature = body.signature

        // Status
        if (body.status !== undefined) updateData.status = body.status

        // Campaign settings
        if (body.dailyLimit !== undefined) updateData.dailyLimit = parseInt(body.dailyLimit)
        if (body.minWaitTime !== undefined) updateData.minWaitTime = parseInt(body.minWaitTime)
        if (body.slowRamp !== undefined) updateData.slowRamp = body.slowRamp

        // Warmup settings
        if (body.warmupEnabled !== undefined) {
            updateData.warmupEnabled = body.warmupEnabled
        }
        if (body.warmupTag !== undefined) updateData.warmupTag = body.warmupTag
        if (body.warmupDailyLimit !== undefined) updateData.warmupDailyLimit = parseInt(body.warmupDailyLimit)
        if (body.warmupMaxPerDay !== undefined) updateData.warmupMaxPerDay = parseInt(body.warmupMaxPerDay)
        if (body.warmupReplyRate !== undefined) updateData.warmupReplyRate = parseInt(body.warmupReplyRate)
        if (body.warmupDailyIncrease !== undefined) updateData.warmupDailyIncrease = parseInt(body.warmupDailyIncrease)
        if (body.warmupPoolOptIn !== undefined) updateData.warmupPoolOptIn = body.warmupPoolOptIn

        // Credentials Update Logic
        if (body.smtpHost !== undefined) updateData.smtpHost = body.smtpHost
        if (body.smtpPort !== undefined) updateData.smtpPort = parseInt(body.smtpPort)
        if (body.smtpUser !== undefined) updateData.smtpUser = body.smtpUser
        if (body.imapHost !== undefined) updateData.imapHost = body.imapHost
        if (body.imapPort !== undefined) updateData.imapPort = parseInt(body.imapPort)
        if (body.imapUser !== undefined) updateData.imapUser = body.imapUser

        // Handle Password Update & Verification
        if (body.smtpPass && body.smtpPass.trim() !== "") {
            try {
                // Construct the config to test
                // Use provided values, or fall back to existing values in DB
                const host = body.smtpHost || accountBefore.smtpHost
                const port = body.smtpPort ? parseInt(body.smtpPort) : (accountBefore.smtpPort || 587)
                const user = body.smtpUser || accountBefore.smtpUser || accountBefore.email
                const pass = body.smtpPass
                const secure = port === 465

                const nodemailer = (await import('nodemailer')).default
                const transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure,
                    auth: { user, pass }
                })

                // Verify the connection with new credentials
                await transporter.verify()

                // If successful, save the new password
                updateData.smtpPass = pass

                // If IMAP password wasn't explicitly provided, update it to match SMTP (common for App Passwords)
                if (!body.imapPass) {
                    updateData.imapPass = pass
                }
                if (body.imapPass) {
                    updateData.imapPass = body.imapPass
                }

                // Clear any credential errors
                updateData.status = 'active'
                updateData.hasError = false
                updateData.errorDetail = null

            } catch (verifyError: any) {
                console.error("Verification failed during update:", verifyError)
                return NextResponse.json({
                    error: `Connection failed: ${verifyError.message || 'Invalid credentials'}`
                }, { status: 400 })
            }
        }

        const account = await prisma.emailAccount.update({
            where: { id },
            data: updateData
        })

        const warmupEmailsLimit = calculateWarmupLimit(account)

        // Calculate health score when warmup is enabled or pool is opted in
        let healthScore = account.healthScore || 100
        if (body.warmupEnabled === true || body.warmupPoolOptIn === true) {
            const { calculateAndUpdateHealthScore } = await import('@/lib/warmup')
            healthScore = await calculateAndUpdateHealthScore(id)
        }

        return NextResponse.json({ 
            success: true, 
            account,
            warmupEmailsLimit,
            healthScore
        })
    } catch (error) {
        console.error('Failed to update account:', error)
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
    }
}

// DELETE - Remove account
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check if account exists first
        const existingAccount = await prisma.emailAccount.findUnique({ where: { id } })
        if (!existingAccount) {
            return NextResponse.json({ success: true })
        }

        await prisma.$transaction(async (tx) => {
            // Delete related warmup logs (use deleteMany - won't throw if none exist)
            await tx.warmupLog.deleteMany({ where: { accountId: id } })

            // Delete related campaign associations (use deleteMany - won't throw if none exist)
            await tx.campaignEmailAccount.deleteMany({ where: { emailAccountId: id } })

            // Delete account
            await tx.emailAccount.delete({ where: { id } })
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Failed to delete account:', error)
        if (error.code === 'P2025') {
            return NextResponse.json({ success: true })
        }
        return NextResponse.json({ error: `Failed to delete account: ${error.message}` }, { status: 500 })
    }
}
