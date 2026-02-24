import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Find a user and workspace
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found.");
        return;
    }
    const workspaceMember = await prisma.workspaceMember.findFirst({
        where: { userId: user.id }
    });

    if (!workspaceMember) {
        console.log("No workspace member found.");
        return;
    }

    // 2. Find or create a campaign
    let campaign = await prisma.campaign.findFirst();
    if (!campaign) {
        campaign = await prisma.campaign.create({
            data: {
                name: "Test Campaign",
            }
        });
    }

    // 3. Link campaign to workspace
    const link = await prisma.campaignWorkspace.findFirst({
        where: { campaignId: campaign.id, workspaceId: workspaceMember.workspaceId }
    });

    if (!link) {
        await prisma.campaignWorkspace.create({
            data: {
                campaignId: campaign.id,
                workspaceId: workspaceMember.workspaceId
            }
        });
    }

    // 4. Create dummy stat
    const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    await prisma.campaignStat.upsert({
        where: { campaignId_date: { campaignId: campaign.id, date: todayUTC } },
        create: { campaignId: campaign.id, date: todayUTC, sent: 15 },
        update: { sent: { increment: 15 } }
    });

    console.log("Inserted dummy data successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
