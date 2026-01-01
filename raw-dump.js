const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function rawDump() {
    console.log('--- Raw DB Dump (Sample) ---');

    const allCampaigns = await prisma.campaign.findMany({ take: 5 });
    console.log('Campaigns sample:', allCampaigns.map(c => ({ id: c.id, name: c.name, status: c.status })));

    const allAccounts = await prisma.emailAccount.findMany({ take: 5 });
    console.log('Accounts sample:', allAccounts.map(a => ({ id: a.id, email: a.email, status: a.status })));

    const leadCount = await prisma.lead.count();
    console.log(`Total Leads: ${leadCount}`);

    const eventCount = await prisma.sendingEvent.count();
    console.log(`Total Events: ${eventCount}`);

    await prisma.$disconnect();
}

rawDump().catch(console.error);
