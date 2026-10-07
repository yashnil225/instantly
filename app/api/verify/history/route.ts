import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const currentUserId = session.user.id

        const jobs = await prisma.verificationJob.findMany({
            where: { userId: currentUserId },
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: {
                id: true,
                fileName: true,
                total: true,
                processed: true,
                validCount: true,
                riskyCount: true,
                invalidCount: true,
                disposableCount: true,
                progress: true,
                status: true,
                currentLog: true,
                createdAt: true,
                completedAt: true
            }
        })

        return NextResponse.json({ jobs })
    } catch (e: any) {
        console.error('Failed to fetch verification history from DB', e)
        return NextResponse.json({ error: e.message || 'Failed to fetch history' }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const currentUserId = session.user.id

        await prisma.verificationJob.deleteMany({
            where: { userId: currentUserId }
        })
        return NextResponse.json({ success: true, message: 'Your verification jobs and records deleted from database' })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to clear history' }, { status: 500 })
    }
}
