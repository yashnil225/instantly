import { z } from "zod"
import { prisma } from "../db.js"

export const getUniboxThreadsSchema = {
  status: z.enum(["all", "unread", "starred", "archived"]).default("all").describe("Filter threads by status"),
  campaignId: z.string().optional().describe("Filter threads by campaign"),
  aiLabel: z.string().optional().describe("Filter by AI label (e.g. 'out_of_office', 'wrong_person', 'interested')"),
  search: z.string().optional().describe("Search lead name, email, or message details"),
  limit: z.number().int().min(1).max(100).default(30).describe("Number of threads to return"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
}

export async function handleGetUniboxThreads(args: {
  status?: "all" | "unread" | "starred" | "archived"
  campaignId?: string
  aiLabel?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const { status = "all", campaignId, aiLabel, search, limit = 30, offset = 0 } = args
  const where: any = {}

  if (campaignId) where.campaignId = campaignId
  if (aiLabel) where.aiLabel = aiLabel

  if (status === "unread") where.isRead = false
  if (status === "starred") where.isStarred = true
  if (status === "archived") where.isArchived = true
  if (status === "all") where.isArchived = false

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { company: { contains: search } },
    ]
  }

  // Only show leads that have events or status indicating correspondence
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { updatedAt: "desc" },
      include: {
        campaign: { select: { id: true, name: true } },
        events: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            emailAccount: {
              select: { id: true, email: true },
            },
          },
        },
      },
    }),
    prisma.lead.count({ where }),
  ])

  return {
    total,
    count: leads.length,
    offset,
    threads: leads.map((l) => ({
      leadId: l.id,
      leadEmail: l.email,
      leadName: `${l.firstName || ""} ${l.lastName || ""}`.trim() || l.email,
      company: l.company,
      campaign: l.campaign,
      status: l.status,
      score: l.score,
      aiLabel: l.aiLabel,
      isRead: l.isRead,
      isStarred: l.isStarred,
      isArchived: l.isArchived,
      lastActivityAt: l.updatedAt,
      recentEvents: l.events.map((e) => ({
        id: e.id,
        type: e.type,
        senderAccount: e.emailAccount?.email,
        details: e.details,
        createdAt: e.createdAt,
      })),
    })),
  }
}

export const updateThreadSchema = {
  leadId: z.string().describe("Lead ID / Thread ID"),
  isRead: z.boolean().optional().describe("Mark thread as read/unread"),
  isStarred: z.boolean().optional().describe("Mark thread as starred/unstarred"),
  isArchived: z.boolean().optional().describe("Archive or unarchive thread"),
  aiLabel: z.string().optional().describe("Update AI classification tag"),
}

export async function handleUpdateThread(args: {
  leadId: string
  isRead?: boolean
  isStarred?: boolean
  isArchived?: boolean
  aiLabel?: string
}) {
  const { leadId, ...data } = args
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data,
  })

  return {
    success: true,
    message: `Thread for ${lead.email} updated`,
    lead: {
      id: lead.id,
      email: lead.email,
      isRead: lead.isRead,
      isStarred: lead.isStarred,
      isArchived: lead.isArchived,
      aiLabel: lead.aiLabel,
    },
  }
}
