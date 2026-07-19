const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    let totalDuplicatesRemoved = 0

    console.log("Cleaning up OPEN events...")
    const allOpens = await prisma.sendingEvent.findMany({
        where: { type: 'open' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, campaignId: true, leadId: true }
    })
    
    const openSeen = new Map()
    const openDuplicateIds = []
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
        console.log(`Deleted ${result.count} duplicate OPEN events`)
    }

    console.log("Cleaning up SENT events...")
    const allSents = await prisma.sendingEvent.findMany({
        where: { type: 'sent' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, campaignId: true, leadId: true, metadata: true }
    })
    
    const sentSeen = new Map()
    const sentDuplicateIds = []
    for (const event of allSents) {
        let step = '1'
        try {
            const meta = JSON.parse(event.metadata || '{}')
            step = String(meta.step || '1')
        } catch (e) {}
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
        console.log(`Deleted ${result.count} duplicate SENT events`)
    }

    // Recalculate
    const campaigns = await prisma.campaign.findMany({ select: { id: true } })
    for (const campaign of campaigns) {
        const uniqueSent = await prisma.sendingEvent.count({ where: { campaignId: campaign.id, type: 'sent' } })
        const uniqueOpens = await prisma.sendingEvent.count({ where: { campaignId: campaign.id, type: 'open' } })
        const uniqueClicks = await prisma.sendingEvent.count({ where: { campaignId: campaign.id, type: 'click' } })
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { sentCount: uniqueSent, openCount: uniqueOpens, clickCount: uniqueClicks }
        })
    }
    
    console.log("Cleanup complete!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
