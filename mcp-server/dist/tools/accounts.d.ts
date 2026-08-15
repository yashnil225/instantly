import { z } from "zod";
export declare const listAccountsSchema: {
    status: z.ZodOptional<z.ZodEnum<["active", "paused", "error", "all"]>>;
    warmupEnabled: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
};
export declare function handleListAccounts(args: {
    status?: "active" | "paused" | "error" | "all";
    warmupEnabled?: boolean;
    limit?: number;
}): Promise<{
    total: number;
    accounts: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        provider: string;
        status: string;
        healthScore: number;
        dailyLimit: number;
        sentToday: number;
        warmup: {
            enabled: boolean;
            score: number;
            currentDay: number;
            dailyLimit: number;
            dailyIncrease: number;
            sentToday: number;
            repliedToday: number;
            poolOptIn: boolean;
            lastWarmupSentAt: Date | null;
        };
        campaignsAttachedCount: number;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
export declare const getAccountSchema: {
    accountId: z.ZodString;
};
export declare function handleGetAccount(args: {
    accountId: string;
}): Promise<{
    account: {
        id: string;
        email: string;
        name: string;
        provider: string;
        status: string;
        healthScore: number;
        bounceCount: number;
        dailyLimit: number;
        sentToday: number;
        minWaitTime: number;
        signature: string | null;
        warmup: {
            enabled: boolean;
            score: number;
            dailyLimit: number;
            dailyIncrease: number;
            replyRate: number;
            sentToday: number;
            repliedToday: number;
            poolOptIn: boolean;
            currentDay: number;
            lastActive: Date | null;
        };
        campaigns: {
            status: string;
            id: string;
            name: string;
        }[];
        recentWarmupLogs: {
            id: string;
            action: string;
            fromEmail: string | null;
            toEmail: string | null;
            details: string | null;
            createdAt: Date;
        }[];
    };
}>;
export declare const updateWarmupSchema: {
    accountId: z.ZodString;
    enabled: z.ZodOptional<z.ZodBoolean>;
    dailyLimit: z.ZodOptional<z.ZodNumber>;
    dailyIncrease: z.ZodOptional<z.ZodNumber>;
    replyRate: z.ZodOptional<z.ZodNumber>;
    poolOptIn: z.ZodOptional<z.ZodBoolean>;
};
export declare function handleUpdateWarmup(args: {
    accountId: string;
    enabled?: boolean;
    dailyLimit?: number;
    dailyIncrease?: number;
    replyRate?: number;
    poolOptIn?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    warmup: {
        enabled: boolean;
        dailyLimit: number;
        dailyIncrease: number;
        replyRate: number;
        poolOptIn: boolean;
    };
}>;
export declare const linkAccountToCampaignSchema: {
    campaignId: z.ZodString;
    accountId: z.ZodString;
    action: z.ZodEnum<["link", "unlink"]>;
};
export declare function handleLinkAccountToCampaign(args: {
    campaignId: string;
    accountId: string;
    action: "link" | "unlink";
}): Promise<{
    success: boolean;
    message: string;
}>;
