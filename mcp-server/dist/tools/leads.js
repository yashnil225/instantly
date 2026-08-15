import { z } from "zod";
import { prisma } from "../db.js";
export const listLeadsSchema = {
    campaignId: z.string().optional().describe("Filter leads by campaign ID"),
    status: z
        .enum(["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead", "all"])
        .optional()
        .describe("Filter leads by outreach status"),
    search: z.string().optional().describe("Search term for email, first name, last name, or company"),
    aiLabel: z.string().optional().describe("Filter by AI label (e.g. 'out_of_office', 'not_interested', etc.)"),
    isStarred: z.boolean().optional().describe("Filter by starred status"),
    isArchived: z.boolean().optional().describe("Filter by archived status"),
    limit: z.number().int().min(1).max(200).default(50).describe("Number of leads to return"),
    offset: z.number().int().min(0).default(0).describe("Offset for pagination"),
};
export async function handleListLeads(args) {
    const { campaignId, status, search, aiLabel, isStarred, isArchived, limit = 50, offset = 0 } = args;
    const where = {};
    if (campaignId) {
        where.campaignId = campaignId;
    }
    if (status && status !== "all") {
        where.status = status;
    }
    if (aiLabel) {
        where.aiLabel = aiLabel;
    }
    if (isStarred !== undefined) {
        where.isStarred = isStarred;
    }
    if (isArchived !== undefined) {
        where.isArchived = isArchived;
    }
    if (search) {
        where.OR = [
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { company: { contains: search } },
        ];
    }
    const [leads, total] = await Promise.all([
        prisma.lead.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            include: {
                campaign: {
                    select: { id: true, name: true },
                },
                tags: {
                    include: { tag: true },
                },
                _count: {
                    select: { events: true },
                },
            },
        }),
        prisma.lead.count({ where }),
    ]);
    return {
        total,
        count: leads.length,
        offset,
        leads: leads.map((l) => ({
            id: l.id,
            email: l.email,
            firstName: l.firstName,
            lastName: l.lastName,
            company: l.company,
            website: l.website,
            phone: l.phone,
            status: l.status,
            score: l.score,
            aiLabel: l.aiLabel,
            isRead: l.isRead,
            isStarred: l.isStarred,
            isArchived: l.isArchived,
            campaign: l.campaign,
            customFields: l.customFields ? JSON.parse(l.customFields) : null,
            tags: l.tags.map((t) => t.tag.name),
            eventsCount: l._count.events,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
        })),
    };
}
export const addLeadSchema = {
    campaignId: z.string().describe("Target campaign ID"),
    email: z.string().email().describe("Lead email address"),
    firstName: z.string().optional().describe("Lead first name"),
    lastName: z.string().optional().describe("Lead last name"),
    company: z.string().optional().describe("Company or organization name"),
    website: z.string().optional().describe("Company website"),
    phone: z.string().optional().describe("Phone number"),
    customFields: z.record(z.any()).optional().describe("Dynamic custom variables for template personalization"),
};
export async function handleAddLead(args) {
    const campaign = await prisma.campaign.findUnique({ where: { id: args.campaignId } });
    if (!campaign) {
        throw new Error(`Campaign ${args.campaignId} does not exist`);
    }
    const existingLead = await prisma.lead.findUnique({
        where: {
            email_campaignId: {
                email: args.email.toLowerCase().trim(),
                campaignId: args.campaignId,
            },
        },
    });
    if (existingLead) {
        throw new Error(`Lead with email ${args.email} already exists in campaign ${args.campaignId}`);
    }
    const lead = await prisma.lead.create({
        data: {
            campaignId: args.campaignId,
            email: args.email.toLowerCase().trim(),
            firstName: args.firstName,
            lastName: args.lastName,
            company: args.company,
            website: args.website,
            phone: args.phone,
            customFields: args.customFields ? JSON.stringify(args.customFields) : null,
            status: "new",
        },
    });
    return {
        success: true,
        message: `Lead ${lead.email} added to campaign '${campaign.name}'`,
        leadId: lead.id,
        lead,
    };
}
export const bulkAddLeadsSchema = {
    campaignId: z.string().describe("Target campaign ID"),
    leads: z
        .array(z.object({
        email: z.string().email().describe("Lead email"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        company: z.string().optional(),
        website: z.string().optional(),
        phone: z.string().optional(),
        customFields: z.record(z.any()).optional(),
    }))
        .min(1)
        .max(500)
        .describe("Array of leads to import"),
};
export async function handleBulkAddLeads(args) {
    const campaign = await prisma.campaign.findUnique({ where: { id: args.campaignId } });
    if (!campaign) {
        throw new Error(`Campaign ${args.campaignId} does not exist`);
    }
    let added = 0;
    let skipped = 0;
    const errors = [];
    for (const item of args.leads) {
        const emailClean = item.email.toLowerCase().trim();
        try {
            await prisma.lead.upsert({
                where: {
                    email_campaignId: {
                        email: emailClean,
                        campaignId: args.campaignId,
                    },
                },
                create: {
                    campaignId: args.campaignId,
                    email: emailClean,
                    firstName: item.firstName,
                    lastName: item.lastName,
                    company: item.company,
                    website: item.website,
                    phone: item.phone,
                    customFields: item.customFields ? JSON.stringify(item.customFields) : null,
                    status: "new",
                },
                update: {
                    firstName: item.firstName,
                    lastName: item.lastName,
                    company: item.company,
                    website: item.website,
                    phone: item.phone,
                    ...(item.customFields ? { customFields: JSON.stringify(item.customFields) } : {}),
                },
            });
            added++;
        }
        catch (err) {
            skipped++;
            errors.push(`Failed to import ${emailClean}: ${err?.message}`);
        }
    }
    return {
        success: true,
        totalProcessed: args.leads.length,
        addedOrUpdated: added,
        skipped,
        errors: errors.slice(0, 10),
    };
}
export const updateLeadSchema = {
    leadId: z.string().describe("Lead ID"),
    status: z
        .enum(["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead"])
        .optional()
        .describe("Update lead outreach status"),
    score: z.number().int().min(0).max(100).optional().describe("Update engagement score (0-100)"),
    aiLabel: z.string().optional().describe("Set AI label (e.g., 'interested', 'wrong_person', 'out_of_office')"),
    isStarred: z.boolean().optional().describe("Mark lead as starred/important"),
    isArchived: z.boolean().optional().describe("Archive lead"),
    isRead: z.boolean().optional().describe("Mark read or unread"),
};
export async function handleUpdateLead(args) {
    const { leadId, ...data } = args;
    const lead = await prisma.lead.update({
        where: { id: leadId },
        data,
    });
    return {
        success: true,
        message: `Lead ${lead.email} updated successfully`,
        lead,
    };
}
export const deleteLeadSchema = {
    leadId: z.string().describe("Lead ID to delete"),
};
export async function handleDeleteLead(args) {
    await prisma.lead.delete({
        where: { id: args.leadId },
    });
    return {
        success: true,
        message: `Lead ${args.leadId} deleted successfully`,
    };
}
//# sourceMappingURL=leads.js.map