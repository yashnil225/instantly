import { z } from "zod";
export declare const listCampaignsSchema: {
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "paused", "completed", "all"]>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
};
export declare function handleListCampaigns(args: {
    status?: "draft" | "active" | "paused" | "completed" | "all";
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    total: number;
    count: number;
    offset: number;
    campaigns: {
        id: string;
        name: string;
        status: string;
        stats: {
            sent: number;
            opens: number;
            clicks: number;
            replies: number;
            bounces: number;
            openRate: string;
            replyRate: string;
        };
        leadsCount: number;
        sequencesCount: number;
        connectedAccountsCount: number;
        tags: string[];
        schedule: {
            startTime: string | null;
            endTime: string | null;
            timezone: string | null;
            days: string | null;
        };
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
export declare const getCampaignSchema: {
    campaignId: z.ZodString;
};
export declare function handleGetCampaign(args: {
    campaignId: string;
}): Promise<{
    campaign: {
        id: string;
        name: string;
        status: string;
        settings: {
            dailyLimit: number | null;
            stopOnReply: boolean;
            trackOpens: boolean;
            trackLinks: boolean;
            extendedSettings: any;
        };
        schedule: {
            name: string | null;
            startTime: string | null;
            endTime: string | null;
            timezone: string | null;
            days: string | null;
            startDate: Date | null;
            endDate: Date | null;
        };
        stats: {
            sent: number;
            opens: number;
            clicks: number;
            replies: number;
            bounces: number;
            openRate: string;
            replyRate: string;
        };
        leadsCount: number;
        tags: string[];
        connectedAccounts: {
            status: string;
            id: string;
            dailyLimit: number;
            email: string;
            provider: string;
            warmupScore: number;
        }[];
        sequences: {
            id: string;
            stepNumber: number;
            dayGap: number;
            variants: {
                id: string;
                label: string | null;
                subject: string | null;
                body: string;
                weight: number;
                enabled: boolean;
            }[];
        }[];
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const createCampaignSchema: {
    name: z.ZodString;
    dailyLimit: z.ZodOptional<z.ZodNumber>;
    stopOnReply: z.ZodDefault<z.ZodBoolean>;
    trackOpens: z.ZodDefault<z.ZodBoolean>;
    trackLinks: z.ZodDefault<z.ZodBoolean>;
    startTime: z.ZodDefault<z.ZodString>;
    endTime: z.ZodDefault<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    days: z.ZodDefault<z.ZodString>;
    emailAccountIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
};
export declare function handleCreateCampaign(args: {
    name: string;
    dailyLimit?: number;
    stopOnReply?: boolean;
    trackOpens?: boolean;
    trackLinks?: boolean;
    startTime?: string;
    endTime?: string;
    timezone?: string;
    days?: string;
    emailAccountIds?: string[];
}): Promise<{
    success: boolean;
    message: string;
    campaignId: string;
    campaign: {
        status: string;
        id: string;
        name: string;
        userId: string | null;
        sentCount: number;
        openCount: number;
        clickCount: number;
        replyCount: number;
        bounceCount: number;
        dailyLimit: number | null;
        stopOnReply: boolean;
        trackOpens: boolean;
        trackLinks: boolean;
        settings: string | null;
        lastAccountIndex: number;
        scheduleName: string | null;
        startTime: string | null;
        endTime: string | null;
        timezone: string | null;
        days: string | null;
        startDate: Date | null;
        endDate: Date | null;
        schedules: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const updateCampaignStatusSchema: {
    campaignId: z.ZodString;
    status: z.ZodEnum<["draft", "active", "paused", "completed"]>;
};
export declare function handleUpdateCampaignStatus(args: {
    campaignId: string;
    status: "draft" | "active" | "paused" | "completed";
}): Promise<{
    success: boolean;
    message: string;
    campaignId: string;
    status: string;
}>;
export declare const deleteCampaignSchema: {
    campaignId: z.ZodString;
};
export declare function handleDeleteCampaign(args: {
    campaignId: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
