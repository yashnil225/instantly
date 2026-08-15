import { z } from "zod"
import { prisma } from "../db.js"

export const listCampaignsSchema = {
  status: z.enum(["draft", "active", "paused", "completed", "all"]).optional().describe("Filter campaigns by status"),
  search: z.string().optional().describe("Search term for campaign name"),
  limit: z.number().int().min(1).max(100).default(20).describe("Number of campaigns to return"),
  offset: z.number().int().min(0).default(0).describe("Offset for pagination"),
}

export async function handleListCampaigns(args: {
  status?: "draft" | "active" | "paused" | "completed" | "all"
  search?: string
  limit?: number
  offset?: number
}) {
  const { status, search, limit = 20, offset = 0 } = args
  const where: any = {}

  if (status && status !== "all") {
    where.status = status
  }
  if (search) {
    where.name = { contains: search }
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            leads: true,
            sequences: true,
            campaignAccounts: true,
          },
        },
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.campaign.count({ where }),
  ])

  return {
    total,
    count: campaigns.length,
    offset,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      stats: {
        sent: c.sentCount,
        opens: c.openCount,
        clicks: c.clickCount,
        replies: c.replyCount,
        bounces: c.bounceCount,
        openRate: c.sentCount > 0 ? `${((c.openCount / c.sentCount) * 100).toFixed(1)}%` : "0%",
        replyRate: c.sentCount > 0 ? `${((c.replyCount / c.sentCount) * 100).toFixed(1)}%` : "0%",
      },
      leadsCount: c._count.leads,
      sequencesCount: c._count.sequences,
      connectedAccountsCount: c._count.campaignAccounts,
      tags: c.tags.map((t) => t.tag.name),
      schedule: {
        startTime: c.startTime,
        endTime: c.endTime,
        timezone: c.timezone,
        days: c.days,
      },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  }
}

export const getCampaignSchema = {
  campaignId: z.string().describe("The ID of the campaign to retrieve"),
}

export async function handleGetCampaign(args: { campaignId: string }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: args.campaignId },
    include: {
      campaignAccounts: {
        include: {
          emailAccount: {
            select: {
              id: true,
              email: true,
              provider: true,
              status: true,
              dailyLimit: true,
              warmupScore: true,
            },
          },
        },
      },
      sequences: {
        orderBy: { stepNumber: "asc" },
        include: {
          variants: true,
        },
      },
      tags: {
        include: { tag: true },
      },
      _count: {
        select: {
          leads: true,
        },
      },
    },
  })

  if (!campaign) {
    throw new Error(`Campaign with ID ${args.campaignId} not found`)
  }

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      settings: {
        dailyLimit: campaign.dailyLimit,
        stopOnReply: campaign.stopOnReply,
        trackOpens: campaign.trackOpens,
        trackLinks: campaign.trackLinks,
        extendedSettings: campaign.settings ? JSON.parse(campaign.settings) : null,
      },
      schedule: {
        name: campaign.scheduleName,
        startTime: campaign.startTime,
        endTime: campaign.endTime,
        timezone: campaign.timezone,
        days: campaign.days,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      stats: {
        sent: campaign.sentCount,
        opens: campaign.openCount,
        clicks: campaign.clickCount,
        replies: campaign.replyCount,
        bounces: campaign.bounceCount,
        openRate: campaign.sentCount > 0 ? `${((campaign.openCount / campaign.sentCount) * 100).toFixed(1)}%` : "0%",
        replyRate: campaign.sentCount > 0 ? `${((campaign.replyCount / campaign.sentCount) * 100).toFixed(1)}%` : "0%",
      },
      leadsCount: campaign._count.leads,
      tags: campaign.tags.map((t) => t.tag.name),
      connectedAccounts: campaign.campaignAccounts.map((ca) => ca.emailAccount),
      sequences: campaign.sequences.map((s) => ({
        id: s.id,
        stepNumber: s.stepNumber,
        dayGap: s.dayGap,
        variants: s.variants.map((v) => ({
          id: v.id,
          label: v.label,
          subject: v.subject,
          body: v.body,
          weight: v.weight,
          enabled: v.enabled,
        })),
      })),
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    },
  }
}

export const createCampaignSchema = {
  name: z.string().min(1).describe("Name of the campaign"),
  dailyLimit: z.number().int().min(1).optional().describe("Daily email sending limit"),
  stopOnReply: z.boolean().default(true).describe("Stop follow-up sequences when lead replies"),
  trackOpens: z.boolean().default(true).describe("Track email opens"),
  trackLinks: z.boolean().default(true).describe("Track link clicks in emails"),
  startTime: z.string().default("09:00").describe("Start time for sending window (HH:mm)"),
  endTime: z.string().default("17:00").describe("End time for sending window (HH:mm)"),
  timezone: z.string().default("UTC").describe("Timezone for sending schedule (e.g. 'America/New_York')"),
  days: z.string().default("Mon,Tue,Wed,Thu,Fri").describe("Comma-separated active sending days"),
  emailAccountIds: z.array(z.string()).optional().describe("List of EmailAccount IDs to assign to this campaign"),
}

export async function handleCreateCampaign(args: {
  name: string
  dailyLimit?: number
  stopOnReply?: boolean
  trackOpens?: boolean
  trackLinks?: boolean
  startTime?: string
  endTime?: string
  timezone?: string
  days?: string
  emailAccountIds?: string[]
}) {
  const user = await prisma.user.findFirst()

  const campaign = await prisma.campaign.create({
    data: {
      name: args.name,
      status: "draft",
      userId: user?.id,
      dailyLimit: args.dailyLimit,
      stopOnReply: args.stopOnReply ?? true,
      trackOpens: args.trackOpens ?? true,
      trackLinks: args.trackLinks ?? true,
      startTime: args.startTime || "09:00",
      endTime: args.endTime || "17:00",
      timezone: args.timezone || "UTC",
      days: args.days || "Mon,Tue,Wed,Thu,Fri",
      ...(args.emailAccountIds && args.emailAccountIds.length > 0
        ? {
            campaignAccounts: {
              create: args.emailAccountIds.map((id) => ({
                emailAccountId: id,
              })),
            },
          }
        : {}),
    },
  })

  return {
    success: true,
    message: `Campaign '${campaign.name}' created successfully in draft mode`,
    campaignId: campaign.id,
    campaign,
  }
}

export const updateCampaignStatusSchema = {
  campaignId: z.string().describe("ID of the campaign"),
  status: z.enum(["draft", "active", "paused", "completed"]).describe("New status for the campaign"),
}

export async function handleUpdateCampaignStatus(args: {
  campaignId: string
  status: "draft" | "active" | "paused" | "completed"
}) {
  const campaign = await prisma.campaign.update({
    where: { id: args.campaignId },
    data: { status: args.status },
  })

  return {
    success: true,
    message: `Campaign status updated to '${args.status}'`,
    campaignId: campaign.id,
    status: campaign.status,
  }
}

export const deleteCampaignSchema = {
  campaignId: z.string().describe("ID of the campaign to delete"),
}

export async function handleDeleteCampaign(args: { campaignId: string }) {
  await prisma.campaign.delete({
    where: { id: args.campaignId },
  })

  return {
    success: true,
    message: `Campaign ${args.campaignId} deleted successfully`,
  }
}
