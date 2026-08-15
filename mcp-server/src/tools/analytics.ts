import { z } from "zod"
import { prisma } from "../db.js"

export const getAnalyticsOverviewSchema = {
  startDate: z.string().optional().describe("Start date filter in ISO format (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("End date filter in ISO format (YYYY-MM-DD)"),
}

export async function handleGetAnalyticsOverview(args: {
  startDate?: string
  endDate?: string
}) {
  const [campaigns, accountsCount, leadsCount] = await Promise.all([
    prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        sentCount: true,
        openCount: true,
        clickCount: true,
        replyCount: true,
        bounceCount: true,
      },
    }),
    prisma.emailAccount.count(),
    prisma.lead.count(),
  ])

  let totalSent = 0
  let totalOpens = 0
  let totalClicks = 0
  let totalReplies = 0
  let totalBounces = 0

  campaigns.forEach((c) => {
    totalSent += c.sentCount
    totalOpens += c.openCount
    totalClicks += c.clickCount
    totalReplies += c.replyCount
    totalBounces += c.bounceCount
  })

  const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0
  const replyRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0
  const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0
  const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0

  return {
    summary: {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalConnectedAccounts: accountsCount,
      totalLeads: leadsCount,
      metrics: {
        totalSent,
        totalOpens,
        totalClicks,
        totalReplies,
        totalBounces,
        openRate: `${openRate.toFixed(1)}%`,
        replyRate: `${replyRate.toFixed(1)}%`,
        clickRate: `${clickRate.toFixed(1)}%`,
        bounceRate: `${bounceRate.toFixed(1)}%`,
      },
    },
    topCampaigns: campaigns
      .slice()
      .sort((a, b) => b.sentCount - a.sentCount)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        sent: c.sentCount,
        openRate: c.sentCount > 0 ? `${((c.openCount / c.sentCount) * 100).toFixed(1)}%` : "0%",
        replyRate: c.sentCount > 0 ? `${((c.replyCount / c.sentCount) * 100).toFixed(1)}%` : "0%",
      })),
  }
}

export const getCampaignAnalyticsSchema = {
  campaignId: z.string().describe("Campaign ID to fetch detailed performance timeline for"),
}

export async function handleGetCampaignAnalytics(args: { campaignId: string }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: args.campaignId },
    include: {
      stats: {
        orderBy: { date: "asc" },
      },
      _count: {
        select: { leads: true, events: true },
      },
    },
  })

  if (!campaign) {
    throw new Error(`Campaign ${args.campaignId} not found`)
  }

  const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0
  const replyRate = campaign.sentCount > 0 ? (campaign.replyCount / campaign.sentCount) * 100 : 0
  const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0
  const bounceRate = campaign.sentCount > 0 ? (campaign.bounceCount / campaign.sentCount) * 100 : 0

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    status: campaign.status,
    overview: {
      sent: campaign.sentCount,
      opens: campaign.openCount,
      clicks: campaign.clickCount,
      replies: campaign.replyCount,
      bounces: campaign.bounceCount,
      openRate: `${openRate.toFixed(1)}%`,
      replyRate: `${replyRate.toFixed(1)}%`,
      clickRate: `${clickRate.toFixed(1)}%`,
      bounceRate: `${bounceRate.toFixed(1)}%`,
      totalLeads: campaign._count.leads,
      totalEventsRecorded: campaign._count.events,
    },
    dailyTimeline: campaign.stats.map((stat) => ({
      date: stat.date.toISOString().split("T")[0],
      sent: stat.sent,
      opened: stat.opened,
      replied: stat.replied,
      bounced: stat.bounced,
      clicked: stat.clicked,
    })),
  }
}
