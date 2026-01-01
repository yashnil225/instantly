const { PrismaClient } = require('@prisma/client');
const { calculateWarmupLimit } = require('./lib/warmup');
const prisma = new PrismaClient();

async function checkHealth() {
    console.log('--- System Health Check ---');

    // Warmup Volume Proof
    console.log('Warmup Logic Verification:');
    const mockAccountDay1 = { warmupEnabled: true, warmupCurrentDay: 1, warmupDailyIncrease: 5, warmupDailyLimit: 50 };
    const limitDay1 = calculateWarmupLimit(mockAccountDay1);
    console.log(`  - Day 1 Volume (CurrentDay=1, Increase=5): ${limitDay1} (Should be 1)`);

    const mockAccountDay2 = { warmupEnabled: true, warmupCurrentDay: 2, warmupDailyIncrease: 5, warmupDailyLimit: 50 };
    const limitDay2 = calculateWarmupLimit(mockAccountDay2);
    console.log(`  - Day 2 Volume (CurrentDay=2, Increase=5): ${limitDay2} (Should be 6)`);

    // 1. Check Campaigns
    const activeCampaigns = await prisma.campaign.findMany({
        where: { status: 'active' }
    });
    console.log(`Active Campaigns: ${activeCampaigns.length}`);

    // 2. Check Accounts
    const activeAccounts = await prisma.emailAccount.findMany({
        where: { status: 'active' }
    });
    console.log(`Active Email Accounts: ${activeAccounts.length}`);

    const reachingLimit = activeAccounts.filter(a => a.sentToday >= a.dailyLimit);
    if (reachingLimit.length > 0) {
        console.log(`  - Accounts at daily limit: ${reachingLimit.length}`);
    }

    // 3. Check Leads Due for Sending
    const now = new Date();
    const leadsDue = await prisma.lead.count({
        where: {
            status: { notIn: ['unsubscribed', 'bounced', 'replied', 'sequence_complete'] },
            campaign: { status: 'active' },
            OR: [
                { nextSendAt: null },
                { nextSendAt: { lte: now } }
            ]
        }
    });
    console.log(`Leads Due for Sending: ${leadsDue}`);

    // 4. Last Activity
    const lastSent = await prisma.sendingEvent.findFirst({
        where: { type: 'sent' },
        orderBy: { createdAt: 'desc' }
    });
    if (lastSent) {
        const diffMin = Math.floor((now - lastSent.createdAt) / 60000);
        console.log(`Last Email Sent: ${lastSent.createdAt.toISOString()} (${diffMin} minutes ago)`);
    } else {
        console.log('Last Email Sent: NEVER');
    }

    // 5. Success vs Error Rate (last 24h)
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sentCount = await prisma.sendingEvent.count({
        where: { type: 'sent', createdAt: { gte: last24h } }
    });
    const errorAccounts = await prisma.emailAccount.count({
        where: { status: 'error' }
    });
    console.log(`Emails Sent (last 24h): ${sentCount}`);
    console.log(`Accounts in Error State: ${errorAccounts}`);

    // 6. Warmup Status
    const warmupAccounts = await prisma.emailAccount.count({
        where: { warmupEnabled: true }
    });
    const lastWarmup = await prisma.warmupLog ? await prisma.warmupLog.findFirst({
        orderBy: { createdAt: 'desc' }
    }) : null;

    console.log(`Accounts with Warmup Enabled: ${warmupAccounts}`);
    if (lastWarmup) {
        console.log(`Last Warmup Activity: ${lastWarmup.createdAt.toISOString()}`);
    }

    console.log('--- End of Report ---');
    await prisma.$disconnect();
}

checkHealth().catch(e => {
    console.error(e);
    process.exit(1);
});
