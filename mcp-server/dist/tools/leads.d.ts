import { z } from "zod";
export declare const listLeadsSchema: {
    campaignId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead", "all"]>>;
    search: z.ZodOptional<z.ZodString>;
    aiLabel: z.ZodOptional<z.ZodString>;
    isStarred: z.ZodOptional<z.ZodBoolean>;
    isArchived: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
};
export declare function handleListLeads(args: {
    campaignId?: string;
    status?: string;
    search?: string;
    aiLabel?: string;
    isStarred?: boolean;
    isArchived?: boolean;
    limit?: number;
    offset?: number;
}): Promise<{
    total: number;
    count: number;
    offset: number;
    leads: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        website: string | null;
        phone: string | null;
        status: string;
        score: number;
        aiLabel: string | null;
        isRead: boolean;
        isStarred: boolean;
        isArchived: boolean;
        campaign: {
            id: string;
            name: string;
        };
        customFields: any;
        tags: string[];
        eventsCount: number;
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
export declare const addLeadSchema: {
    campaignId: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
};
export declare function handleAddLead(args: {
    campaignId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    website?: string;
    phone?: string;
    customFields?: Record<string, any>;
}): Promise<{
    success: boolean;
    message: string;
    leadId: string;
    lead: {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        campaignId: string;
        isRead: boolean;
        aiLabel: string | null;
        company: string | null;
        website: string | null;
        phone: string | null;
        customFields: string | null;
        score: number;
        isStarred: boolean;
        isArchived: boolean;
        nextSendAt: Date | null;
        snoozedUntil: Date | null;
        unsubscribeToken: string | null;
    };
}>;
export declare const bulkAddLeadsSchema: {
    campaignId: z.ZodString;
    leads: z.ZodArray<z.ZodObject<{
        email: z.ZodString;
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        company: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
        company?: string | undefined;
        website?: string | undefined;
        phone?: string | undefined;
        customFields?: Record<string, any> | undefined;
    }, {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
        company?: string | undefined;
        website?: string | undefined;
        phone?: string | undefined;
        customFields?: Record<string, any> | undefined;
    }>, "many">;
};
export declare function handleBulkAddLeads(args: {
    campaignId: string;
    leads: Array<{
        email: string;
        firstName?: string;
        lastName?: string;
        company?: string;
        website?: string;
        phone?: string;
        customFields?: Record<string, any>;
    }>;
}): Promise<{
    success: boolean;
    totalProcessed: number;
    addedOrUpdated: number;
    skipped: number;
    errors: string[];
}>;
export declare const updateLeadSchema: {
    leadId: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead"]>>;
    score: z.ZodOptional<z.ZodNumber>;
    aiLabel: z.ZodOptional<z.ZodString>;
    isStarred: z.ZodOptional<z.ZodBoolean>;
    isArchived: z.ZodOptional<z.ZodBoolean>;
    isRead: z.ZodOptional<z.ZodBoolean>;
};
export declare function handleUpdateLead(args: {
    leadId: string;
    status?: string;
    score?: number;
    aiLabel?: string;
    isStarred?: boolean;
    isArchived?: boolean;
    isRead?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    lead: {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        campaignId: string;
        isRead: boolean;
        aiLabel: string | null;
        company: string | null;
        website: string | null;
        phone: string | null;
        customFields: string | null;
        score: number;
        isStarred: boolean;
        isArchived: boolean;
        nextSendAt: Date | null;
        snoozedUntil: Date | null;
        unsubscribeToken: string | null;
    };
}>;
export declare const deleteLeadSchema: {
    leadId: z.ZodString;
};
export declare function handleDeleteLead(args: {
    leadId: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
