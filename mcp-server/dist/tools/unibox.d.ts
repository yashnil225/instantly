import { z } from "zod";
export declare const getUniboxThreadsSchema: {
    status: z.ZodDefault<z.ZodEnum<["all", "unread", "starred", "archived"]>>;
    campaignId: z.ZodOptional<z.ZodString>;
    aiLabel: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
};
export declare function handleGetUniboxThreads(args: {
    status?: "all" | "unread" | "starred" | "archived";
    campaignId?: string;
    aiLabel?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    total: number;
    count: number;
    offset: number;
    threads: {
        leadId: string;
        leadEmail: string;
        leadName: string;
        company: string | null;
        campaign: {
            id: string;
            name: string;
        };
        status: string;
        score: number;
        aiLabel: string | null;
        isRead: boolean;
        isStarred: boolean;
        isArchived: boolean;
        lastActivityAt: Date;
        recentEvents: {
            id: string;
            type: string;
            senderAccount: string | undefined;
            details: string | null;
            createdAt: Date;
        }[];
    }[];
}>;
export declare const updateThreadSchema: {
    leadId: z.ZodString;
    isRead: z.ZodOptional<z.ZodBoolean>;
    isStarred: z.ZodOptional<z.ZodBoolean>;
    isArchived: z.ZodOptional<z.ZodBoolean>;
    aiLabel: z.ZodOptional<z.ZodString>;
};
export declare function handleUpdateThread(args: {
    leadId: string;
    isRead?: boolean;
    isStarred?: boolean;
    isArchived?: boolean;
    aiLabel?: string;
}): Promise<{
    success: boolean;
    message: string;
    lead: {
        id: string;
        email: string;
        isRead: boolean;
        isStarred: boolean;
        isArchived: boolean;
        aiLabel: string | null;
    };
}>;
