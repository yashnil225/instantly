import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// One-time cleanup: Remove duplicate open AND sent events, then recalculate counts
export async function POST() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        let totalDuplicatesRemoved = 0

        // 1. Remove duplicate OPEN events (keep only the first open per lead+campaign)
        const allOpens = await prisma.sendingEvent.findMany({
            where: { type: 'open' },
            orderBy: { createdAt: 'asc' },
            select: { id: true, campaignId: true, leadId: true }
        })

        const openSeen = new Map<string, string>()
        const openDuplicateIds: string[] = []
        for (const event of allOpens) {
            const key = `${event.campaignId}_${event.leadId}`
            if (openSeen.has(key)) {
                openDuplicateIds.push(event.id)
            } else {
                openSeen.set(key, event.id)
            }
        }

        if (openDuplicateIds.length > 0) {
            const result = await prisma.sendingEvent.deleteMany({
                where: { id: { in: openDuplicateIds } }
            })
            totalDuplicatesRemoved += result.count
        }

        // 2. Remove duplicate SENT events per lead+campaign+step (keep oldest)
        const allSents = await prisma.sendingEvent.findMany({
            where: { type: 'sent' },
            orderBy: { createdAt: 'asc' },
            select: { id: true, campaignId: true, leadId: true, metadata: true }
        })

        const sentSeen = new Map<string, string>()
        const sentDuplicateIds: string[] = []
        for (const event of allSents) {
            let step = '1'
            try {
                const meta = JSON.parse(event.metadata || '{}')
                step = String(meta.step || '1')
            } catch {}
            const key = `${event.campaignId}_${event.leadId}_step${step}`
            if (sentSeen.has(key)) {
                sentDuplicateIds.push(event.id)
            } else {
                sentSeen.set(key, event.id)
            }
        }

        if (sentDuplicateIds.length > 0) {
            const result = await prisma.sendingEvent.deleteMany({
                where: { id: { in: sentDuplicateIds } }
            })
            totalDuplicatesRemoved += result.count
        }

        // 3. Recalculate campaign counts from actual unique events
        const campaigns = await prisma.campaign.findMany({
            where: { userId: session.user.id },
            select: { id: true }
        })

        for (const campaign of campaigns) {
            const uniqueSent = await prisma.sendingEvent.count({
                where: { campaignId: campaign.id, type: 'sent' }
            })
            const uniqueOpens = await prisma.sendingEvent.count({
                where: { campaignId: campaign.id, type: 'open' }
            })
            const uniqueClicks = await prisma.sendingEvent.count({
                where: { campaignId: campaign.id, type: 'click' }
            })
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: {
                    sentCount: uniqueSent,
                    openCount: uniqueOpens,
                    clickCount: uniqueClicks
                }
            })
        }

        return NextResponse.json({
            success: true,
            duplicateOpensRemoved: openDuplicateIds.length,
            duplicateSentsRemoved: sentDuplicateIds.length,
            totalDuplicatesRemoved,
            campaignsRecalculated: campaigns.length
        })
    } catch (error) {
        console.error('Cleanup error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
