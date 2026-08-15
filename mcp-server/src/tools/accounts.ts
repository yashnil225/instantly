import { z } from "zod"
import { prisma } from "../db.js"

export const listAccountsSchema = {
  status: z.enum(["active", "paused", "error", "all"]).optional().describe("Filter accounts by status"),
  warmupEnabled: z.boolean().optional().describe("Filter accounts by warmup state"),
  limit: z.number().int().min(1).max(100).default(50).describe("Limit results"),
}

export async function handleListAccounts(args: {
  status?: "active" | "paused" | "error" | "all"
  warmupEnabled?: boolean
  limit?: number
}) {
  const { status, warmupEnabled, limit = 50 } = args
  const where: any = {}

  if (status && status !== "all") {
    where.status = status
  }
  if (warmupEnabled !== undefined) {
    where.warmupEnabled = warmupEnabled
  }

  const accounts = await prisma.emailAccount.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      _count: {
        select: {
          campaignAccounts: true,
          warmupLogs: true,
        },
      },
    },
  })

  return {
    total: accounts.length,
    accounts: accounts.map((a) => ({
      id: a.id,
      email: a.email,
      firstName: a.firstName,
      lastName: a.lastName,
      provider: a.provider,
      status: a.status,
      healthScore: a.healthScore,
      dailyLimit: a.dailyLimit,
      sentToday: a.sentToday,
      warmup: {
        enabled: a.warmupEnabled,
        score: a.warmupScore,
        currentDay: a.warmupCurrentDay,
        dailyLimit: a.warmupDailyLimit,
        dailyIncrease: a.warmupDailyIncrease,
        sentToday: a.warmupSentToday,
        repliedToday: a.warmupRepliedToday,
        poolOptIn: a.warmupPoolOptIn,
        lastWarmupSentAt: a.lastWarmupSentAt,
      },
      campaignsAttachedCount: a._count.campaignAccounts,
      tags: a.tags.map((t) => t.tag.name),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
  }
}

export const getAccountSchema = {
  accountId: z.string().describe("The email account ID"),
}

export async function handleGetAccount(args: { accountId: string }) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: args.accountId },
    include: {
      campaignAccounts: {
        include: {
          campaign: {
            select: { id: true, name: true, status: true },
          },
        },
      },
      warmupLogs: {
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      tags: { include: { tag: true } },
    },
  })

  if (!account) {
    throw new Error(`Email account with ID ${args.accountId} not found`)
  }

  return {
    account: {
      id: account.id,
      email: account.email,
      name: `${account.firstName || ""} ${account.lastName || ""}`.trim(),
      provider: account.provider,
      status: account.status,
      healthScore: account.healthScore,
      bounceCount: account.bounceCount,
      dailyLimit: account.dailyLimit,
      sentToday: account.sentToday,
      minWaitTime: account.minWaitTime,
      signature: account.signature,
      warmup: {
        enabled: account.warmupEnabled,
        score: account.warmupScore,
        dailyLimit: account.warmupDailyLimit,
        dailyIncrease: account.warmupDailyIncrease,
        replyRate: account.warmupReplyRate,
        sentToday: account.warmupSentToday,
        repliedToday: account.warmupRepliedToday,
        poolOptIn: account.warmupPoolOptIn,
        currentDay: account.warmupCurrentDay,
        lastActive: account.lastActive,
      },
      campaigns: account.campaignAccounts.map((ca) => ca.campaign),
      recentWarmupLogs: account.warmupLogs.map((log) => ({
        id: log.id,
        action: log.action,
        fromEmail: log.fromEmail,
        toEmail: log.toEmail,
        details: log.details,
        createdAt: log.createdAt,
      })),
    },
  }
}

export const updateWarmupSchema = {
  accountId: z.string().describe("Email account ID"),
  enabled: z.boolean().optional().describe("Enable or disable warmup"),
  dailyLimit: z.number().int().min(1).max(200).optional().describe("Warmup maximum emails per day"),
  dailyIncrease: z.number().int().min(1).max(50).optional().describe("Daily volume ramp increase"),
  replyRate: z.number().int().min(0).max(100).optional().describe("Target warmup auto-reply percentage"),
  poolOptIn: z.boolean().optional().describe("Opt-in to peer warmup exchange pool"),
}

export async function handleUpdateWarmup(args: {
  accountId: string
  enabled?: boolean
  dailyLimit?: number
  dailyIncrease?: number
  replyRate?: number
  poolOptIn?: boolean
}) {
  const { accountId, ...updates } = args
  const data: any = {}

  if (updates.enabled !== undefined) data.warmupEnabled = updates.enabled
  if (updates.dailyLimit !== undefined) {
    data.warmupDailyLimit = updates.dailyLimit
    data.warmupMaxPerDay = updates.dailyLimit
  }
  if (updates.dailyIncrease !== undefined) data.warmupDailyIncrease = updates.dailyIncrease
  if (updates.replyRate !== undefined) data.warmupReplyRate = updates.replyRate
  if (updates.poolOptIn !== undefined) data.warmupPoolOptIn = updates.poolOptIn

  const account = await prisma.emailAccount.update({
    where: { id: accountId },
    data,
  })

  return {
    success: true,
    message: `Warmup settings updated for ${account.email}`,
    warmup: {
      enabled: account.warmupEnabled,
      dailyLimit: account.warmupDailyLimit,
      dailyIncrease: account.warmupDailyIncrease,
      replyRate: account.warmupReplyRate,
      poolOptIn: account.warmupPoolOptIn,
    },
  }
}

export const linkAccountToCampaignSchema = {
  campaignId: z.string().describe("Campaign ID"),
  accountId: z.string().describe("Email account ID"),
  action: z.enum(["link", "unlink"]).describe("Link or unlink account from campaign"),
}

export async function handleLinkAccountToCampaign(args: {
  campaignId: string
  accountId: string
  action: "link" | "unlink"
}) {
  if (args.action === "link") {
    await prisma.campaignEmailAccount.upsert({
      where: {
        campaignId_emailAccountId: {
          campaignId: args.campaignId,
          emailAccountId: args.accountId,
        },
      },
      create: {
        campaignId: args.campaignId,
        emailAccountId: args.accountId,
      },
      update: {},
    })

    return {
      success: true,
      message: `Account ${args.accountId} successfully linked to campaign ${args.campaignId}`,
    }
  } else {
    await prisma.campaignEmailAccount.deleteMany({
      where: {
        campaignId: args.campaignId,
        emailAccountId: args.accountId,
      },
    })

    return {
      success: true,
      message: `Account ${args.accountId} unlinked from campaign ${args.campaignId}`,
    }
  }
}
