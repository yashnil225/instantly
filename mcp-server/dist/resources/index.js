import { prisma } from "../db.js";
export const resourcesList = [
    {
        uri: "instantly://campaigns",
        name: "Campaigns List",
        description: "Live list of all outreach campaigns with status and performance counters",
        mimeType: "application/json",
    },
    {
        uri: "instantly://accounts",
        name: "Email Accounts & Warmup",
        description: "Configured email sending inboxes, warmup status, and daily limits",
        mimeType: "application/json",
    },
    {
        uri: "instantly://analytics/summary",
        name: "Analytics Summary",
        description: "Workspace-wide email outreach statistics and performance rates",
        mimeType: "application/json",
    },
];
export async function readResource(uri) {
    if (uri === "instantly://campaigns") {
        const campaigns = await prisma.campaign.findMany({
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                name: true,
                status: true,
                sentCount: true,
                openCount: true,
                replyCount: true,
                bounceCount: true,
                updatedAt: true,
            },
        });
        return {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(campaigns, null, 2),
        };
    }
    if (uri === "instantly://accounts") {
        const accounts = await prisma.emailAccount.findMany({
            select: {
                id: true,
                email: true,
                provider: true,
                status: true,
                healthScore: true,
                dailyLimit: true,
                sentToday: true,
                warmupEnabled: true,
                warmupScore: true,
            },
        });
        return {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(accounts, null, 2),
        };
    }
    if (uri === "instantly://analytics/summary") {
        const [campaigns, accountsCount, leadsCount] = await Promise.all([
            prisma.campaign.findMany({
                select: { sentCount: true, openCount: true, replyCount: true, bounceCount: true },
            }),
            prisma.emailAccount.count(),
            prisma.lead.count(),
        ]);
        const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
        const totalOpens = campaigns.reduce((acc, c) => acc + c.openCount, 0);
        const totalReplies = campaigns.reduce((acc, c) => acc + c.replyCount, 0);
        const totalBounces = campaigns.reduce((acc, c) => acc + c.bounceCount, 0);
        const summary = {
            totalCampaigns: campaigns.length,
            totalConnectedAccounts: accountsCount,
            totalLeads: leadsCount,
            totalSent,
            totalOpens,
            totalReplies,
            totalBounces,
            openRate: totalSent > 0 ? `${((totalOpens / totalSent) * 100).toFixed(1)}%` : "0%",
            replyRate: totalSent > 0 ? `${((totalReplies / totalSent) * 100).toFixed(1)}%` : "0%",
        };
        return {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(summary, null, 2),
        };
    }
    throw new Error(`Resource with URI ${uri} not found`);
}
//# sourceMappingURL=index.js.map