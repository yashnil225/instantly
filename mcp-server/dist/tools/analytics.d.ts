import { z } from "zod";
export declare const getAnalyticsOverviewSchema: {
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
};
export declare function handleGetAnalyticsOverview(args: {
    startDate?: string;
    endDate?: string;
}): Promise<{
    summary: {
        totalCampaigns: number;
        activeCampaigns: number;
        totalConnectedAccounts: number;
        totalLeads: number;
        metrics: {
            totalSent: number;
            totalOpens: number;
            totalClicks: number;
            totalReplies: number;
            totalBounces: number;
            openRate: string;
            replyRate: string;
            clickRate: string;
            bounceRate: string;
        };
    };
    topCampaigns: {
        id: string;
        name: string;
        status: string;
        sent: number;
        openRate: string;
        replyRate: string;
    }[];
}>;
export declare const getCampaignAnalyticsSchema: {
    campaignId: z.ZodString;
};
export declare function handleGetCampaignAnalytics(args: {
    campaignId: string;
}): Promise<{
    campaignId: string;
    campaignName: string;
    status: string;
    overview: {
        sent: number;
        opens: number;
        clicks: number;
        replies: number;
        bounces: number;
        openRate: string;
        replyRate: string;
        clickRate: string;
        bounceRate: string;
        totalLeads: number;
        totalEventsRecorded: number;
    };
    dailyTimeline: {
        date: string;
        sent: number;
        opened: number;
        replied: number;
        bounced: number;
        clicked: number;
    }[];
}>;
