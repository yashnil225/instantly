import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        return NextResponse.json({
            ...account,
            warmupStats,
            chartData,
            warmupStarted,
            warmupLogs: undefined // Don't send raw logs
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
        if (body.warmupEnabled !== undefined) updateData.warmupEnabled = body.warmupEnabled
        if (body.warmupTag !== undefined) updateData.warmupTag = body.warmupTag
        if (body.warmupDailyLimit !== undefined) updateData.warmupDailyLimit = parseInt(body.warmupDailyLimit)
        if (body.warmupReplyRate !== undefined) updateData.warmupReplyRate = parseInt(body.warmupReplyRate)
        if (body.warmupDailyIncrease !== undefined) updateData.warmupDailyIncrease = parseInt(body.warmupDailyIncrease)
        if (body.warmupPoolOptIn !== undefined) updateData.warmupPoolOptIn = body.warmupPoolOptIn

        const account = await prisma.emailAccount.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ success: true, account })
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

        await prisma.$transaction(async (tx) => {
            // Delete related warmup logs
            await tx.warmupLog.deleteMany({ where: { accountId: id } })

            // Delete related campaign associations
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
