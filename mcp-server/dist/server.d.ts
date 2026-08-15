import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export declare const tools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            search: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            campaignId: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
            };
            dailyLimit: {
                type: string;
                description: string;
            };
            stopOnReply: {
                type: string;
                description: string;
            };
            trackOpens: {
                type: string;
                description: string;
            };
            trackLinks: {
                type: string;
                description: string;
            };
            startTime: {
                type: string;
                description: string;
            };
            endTime: {
                type: string;
                description: string;
            };
            timezone: {
                type: string;
                description: string;
            };
            days: {
                type: string;
                description: string;
            };
            emailAccountIds: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            campaignId: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            campaignId: {
                type: string;
                description: string;
            };
            dayGap: {
                type: string;
                description: string;
            };
            subject: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            variantLabel: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            variantId: {
                type: string;
                description: string;
            };
            subject: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            weight: {
                type: string;
                description: string;
            };
            enabled: {
                type: string;
                description: string;
            };
            label: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            variantLabel?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sequenceId: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            campaignId: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description?: undefined;
            };
            search: {
                type: string;
                description: string;
            };
            aiLabel: {
                type: string;
                description: string;
            };
            isStarred: {
                type: string;
                description: string;
            };
            isArchived: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            campaignId: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
            };
            firstName: {
                type: string;
                description: string;
            };
            lastName: {
                type: string;
                description: string;
            };
            company: {
                type: string;
                description: string;
            };
            website: {
                type: string;
                description: string;
            };
            phone: {
                type: string;
                description: string;
            };
            customFields: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            campaignId: {
                type: string;
                description: string;
            };
            leads: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        email: {
                            type: string;
                        };
                        firstName: {
                            type: string;
                        };
                        lastName: {
                            type: string;
                        };
                        company: {
                            type: string;
                        };
                        website: {
                            type: string;
                        };
                        phone: {
                            type: string;
                        };
                        customFields: {
                            type: string;
                        };
                    };
                    required: string[];
                };
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            leadId: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description?: undefined;
            };
            score: {
                type: string;
                description: string;
            };
            aiLabel: {
                type: string;
                description: string;
            };
            isStarred: {
                type: string;
                description: string;
            };
            isArchived: {
                type: string;
                description: string;
            };
            isRead: {
                type: string;
                description: string;
            };
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            leadId: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            status: {
                type: string;
                enum: string[];
                description?: undefined;
            };
            warmupEnabled: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            search?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            accountId: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            accountId: {
                type: string;
                description: string;
            };
            enabled: {
                type: string;
                description: string;
            };
            dailyLimit: {
                type: string;
                description: string;
            };
            dailyIncrease: {
                type: string;
                description: string;
            };
            replyRate: {
                type: string;
                description: string;
            };
            poolOptIn: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            campaignId: {
                type: string;
                description: string;
            };
            accountId: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            status: {
                type: string;
                enum: string[];
                description?: undefined;
            };
            campaignId: {
                type: string;
                description: string;
            };
            aiLabel: {
                type: string;
                description: string;
            };
            search: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            leadId: {
                type: string;
                description: string;
            };
            isRead: {
                type: string;
                description?: undefined;
            };
            isStarred: {
                type: string;
                description?: undefined;
            };
            isArchived: {
                type: string;
                description?: undefined;
            };
            aiLabel: {
                type: string;
                description?: undefined;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            score?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            category?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            category: {
                type: string;
                description: string;
            };
            search: {
                type: string;
                description: string;
            };
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            isPublic?: undefined;
            templateId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
            };
            subject: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            isPublic: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            templateId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            templateId: {
                type: string;
                description: string;
            };
            status?: undefined;
            search?: undefined;
            limit?: undefined;
            offset?: undefined;
            campaignId?: undefined;
            name?: undefined;
            dailyLimit?: undefined;
            stopOnReply?: undefined;
            trackOpens?: undefined;
            trackLinks?: undefined;
            startTime?: undefined;
            endTime?: undefined;
            timezone?: undefined;
            days?: undefined;
            emailAccountIds?: undefined;
            dayGap?: undefined;
            subject?: undefined;
            body?: undefined;
            variantLabel?: undefined;
            variantId?: undefined;
            weight?: undefined;
            enabled?: undefined;
            label?: undefined;
            sequenceId?: undefined;
            aiLabel?: undefined;
            isStarred?: undefined;
            isArchived?: undefined;
            email?: undefined;
            firstName?: undefined;
            lastName?: undefined;
            company?: undefined;
            website?: undefined;
            phone?: undefined;
            customFields?: undefined;
            leads?: undefined;
            leadId?: undefined;
            score?: undefined;
            isRead?: undefined;
            warmupEnabled?: undefined;
            accountId?: undefined;
            dailyIncrease?: undefined;
            replyRate?: undefined;
            poolOptIn?: undefined;
            action?: undefined;
            startDate?: undefined;
            endDate?: undefined;
            category?: undefined;
            isPublic?: undefined;
        };
        required: string[];
    };
})[];
export declare function createMcpServer(): Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
}>;
