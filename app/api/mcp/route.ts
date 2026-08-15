import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Resolve user from API key, header, or session
async function resolveUser(req: NextRequest) {
  const url = new URL(req.url)
  const queryKey = url.searchParams.get("apiKey") || url.searchParams.get("key")
  const authHeader = req.headers.get("authorization")
  const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null
  const customHeaderKey = req.headers.get("x-api-key")
  const apiKeyToLookup = queryKey || bearerKey || customHeaderKey

  if (apiKeyToLookup) {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKeyToLookup },
      include: { user: true },
    })

    if (keyRecord?.user) {
      prisma.apiKey
        .update({
          where: { id: keyRecord.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {})
      return keyRecord.user
    }
  }

  try {
    const session = await auth()
    if (session?.user?.id) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      })
      if (sessionUser) return sessionUser
    }
  } catch {}

  try {
    const totalUsers = await prisma.user.count()
    if (totalUsers === 1) {
      return await prisma.user.findFirst()
    }
  } catch {}

  return null
}

// Complete tool catalog
const tools = [
  // --- Workspace Tools ---
  {
    name: "instantly_list_workspaces",
    description: "List all workspaces you own or belong to with member & campaign counts",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "instantly_create_workspace",
    description: "Create a new workspace organization",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Workspace name" },
        opportunityValue: { type: "number", description: "Default lead opportunity value in USD (default 1000)" },
      },
      required: ["name"],
    },
  },
  {
    name: "instantly_rename_workspace",
    description: "Rename an existing workspace",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        name: { type: "string", description: "New workspace name" },
      },
      required: ["workspaceId", "name"],
    },
  },
  {
    name: "instantly_delete_workspace",
    description: "Delete a workspace you own",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID to delete" },
      },
      required: ["workspaceId"],
    },
  },

  // --- Campaign Tools ---
  {
    name: "instantly_list_campaigns",
    description: "List outreach campaigns with status, sending stats, tags, and progress in your workspace",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Filter by specific workspace ID" },
        status: { type: "string", enum: ["draft", "active", "paused", "completed", "all"], description: "Filter by status" },
        search: { type: "string", description: "Search by campaign name" },
        limit: { type: "number", description: "Limit results" },
        offset: { type: "number", description: "Pagination offset" },
      },
    },
  },
  {
    name: "instantly_get_campaign",
    description: "Retrieve complete details for a campaign, including schedule, sequences, and attached accounts",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "instantly_create_campaign",
    description: "Create a new cold outreach campaign with schedule, sending window, and tracking options",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Campaign name" },
        workspaceId: { type: "string", description: "Optional workspace ID to assign this campaign to" },
        dailyLimit: { type: "number", description: "Max emails to send per day" },
        stopOnReply: { type: "boolean", description: "Stop sequences when a lead replies" },
        trackOpens: { type: "boolean", description: "Enable open tracking" },
        trackLinks: { type: "boolean", description: "Enable link click tracking" },
        startTime: { type: "string", description: "Sending start time (e.g. '09:00')" },
        endTime: { type: "string", description: "Sending end time (e.g. '17:00')" },
        timezone: { type: "string", description: "Timezone identifier (e.g. 'America/New_York', 'UTC')" },
        days: { type: "string", description: "Sending days (e.g. 'Mon,Tue,Wed,Thu,Fri')" },
      },
      required: ["name"],
    },
  },
  {
    name: "instantly_rename_campaign",
    description: "Rename a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        name: { type: "string", description: "New campaign name" },
      },
      required: ["campaignId", "name"],
    },
  },
  {
    name: "instantly_duplicate_campaign",
    description: "Duplicate a campaign with all its email sequences, variants, schedule, and account settings",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID to clone" },
        name: { type: "string", description: "Name for the duplicated campaign" },
      },
      required: ["campaignId", "name"],
    },
  },
  {
    name: "instantly_share_campaign_workspace",
    description: "Share or link a campaign to a workspace",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        workspaceId: { type: "string", description: "Workspace ID to share with" },
      },
      required: ["campaignId", "workspaceId"],
    },
  },
  {
    name: "instantly_export_campaign_data",
    description: "Export all campaign leads, statuses, and performance statistics as structured JSON/CSV data",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "instantly_update_campaign_status",
    description: "Update campaign status (draft, active, paused, completed)",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        status: { type: "string", enum: ["draft", "active", "paused", "completed"], description: "New status" },
      },
      required: ["campaignId", "status"],
    },
  },
  {
    name: "instantly_delete_campaign",
    description: "Delete an outreach campaign and its associated sequences and leads",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID to delete" },
      },
      required: ["campaignId"],
    },
  },

  // --- Sequences & Copy ---
  {
    name: "instantly_get_sequences",
    description: "Get sequence steps and A/B variants for a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "instantly_create_sequence_step",
    description: "Add a new email follow-up step to a campaign sequence",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        dayGap: { type: "number", description: "Days to wait after previous step" },
        subject: { type: "string", description: "Email subject line" },
        body: { type: "string", description: "Email body content" },
        variantLabel: { type: "string", description: "Variant label (e.g. 'Variant A')" },
      },
      required: ["campaignId", "body"],
    },
  },
  {
    name: "instantly_update_sequence_variant",
    description: "Update copy, subject, or traffic weight for a sequence variant",
    inputSchema: {
      type: "object",
      properties: {
        variantId: { type: "string", description: "Sequence variant ID" },
        subject: { type: "string", description: "New subject" },
        body: { type: "string", description: "New body" },
        weight: { type: "number", description: "Traffic weight (0-100)" },
        enabled: { type: "boolean", description: "Enable or disable variant" },
      },
      required: ["variantId"],
    },
  },
  {
    name: "instantly_delete_sequence_step",
    description: "Delete a sequence step from a campaign",
    inputSchema: {
      type: "object",
      properties: {
        sequenceId: { type: "string", description: "Sequence step ID" },
      },
      required: ["sequenceId"],
    },
  },

  // --- CRM & Leads ---
  {
    name: "instantly_list_leads",
    description: "List and search leads in your CRM with status and AI sentiment filtering",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Filter by campaign" },
        status: { type: "string", enum: ["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead", "all"] },
        search: { type: "string", description: "Search by email, name, or company" },
        aiLabel: { type: "string", description: "Filter by AI label" },
        limit: { type: "number", description: "Limit" },
        offset: { type: "number", description: "Offset" },
      },
    },
  },
  {
    name: "instantly_add_lead",
    description: "Add an individual lead into a campaign with custom CRM variables",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Target campaign ID" },
        email: { type: "string", description: "Lead email" },
        firstName: { type: "string", description: "First name" },
        lastName: { type: "string", description: "Last name" },
        company: { type: "string", description: "Company name" },
        website: { type: "string", description: "Website URL" },
        phone: { type: "string", description: "Phone number" },
        customFields: { type: "object", description: "Custom dynamic variables" },
      },
      required: ["campaignId", "email"],
    },
  },
  {
    name: "instantly_bulk_add_leads",
    description: "Bulk import multiple leads into a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Target campaign ID" },
        leads: {
          type: "array",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              company: { type: "string" },
              website: { type: "string" },
              phone: { type: "string" },
            },
            required: ["email"],
          },
        },
      },
      required: ["campaignId", "leads"],
    },
  },
  {
    name: "instantly_update_lead",
    description: "Edit CRM lead details (company, website, phone, status, score, notes, tags, unibox status)",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        company: { type: "string" },
        website: { type: "string" },
        phone: { type: "string" },
        status: { type: "string", enum: ["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead"], description: "Lead status" },
        score: { type: "number", description: "Engagement score (0-100)" },
        aiLabel: { type: "string", description: "AI label (e.g. 'interested', 'out_of_office', 'wrong_person')" },
        isStarred: { type: "boolean" },
        isArchived: { type: "boolean" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "instantly_delete_lead",
    description: "Remove a lead from your CRM/campaign",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to delete" },
      },
      required: ["leadId"],
    },
  },

  // --- Email Accounts & Deliverability ---
  {
    name: "instantly_list_accounts",
    description: "List sender email inboxes with stats, sent counts today, warmup health scores, and bounce counts",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["active", "paused", "error", "all"] },
        warmupEnabled: { type: "boolean" },
      },
    },
  },
  {
    name: "instantly_add_email_account",
    description: "Connect a new sender email account (Google, Outlook, or Custom SMTP/IMAP)",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Sender email address" },
        firstName: { type: "string", description: "Sender first name" },
        lastName: { type: "string", description: "Sender last name" },
        provider: { type: "string", enum: ["google", "outlook", "custom"], default: "custom" },
        dailyLimit: { type: "number", default: 50 },
        smtpHost: { type: "string" },
        smtpPort: { type: "number" },
        smtpUser: { type: "string" },
        smtpPass: { type: "string" },
        imapHost: { type: "string" },
        imapPort: { type: "number" },
        imapUser: { type: "string" },
        imapPass: { type: "string" },
      },
      required: ["email"],
    },
  },
  {
    name: "instantly_remove_email_account",
    description: "Remove / disconnect an email sender account",
    inputSchema: {
      type: "object",
      properties: {
        accountId: { type: "string", description: "Account ID to remove" },
      },
      required: ["accountId"],
    },
  },
  {
    name: "instantly_get_account",
    description: "Get detailed account settings, warmup history logs, and attached campaigns",
    inputSchema: {
      type: "object",
      properties: {
        accountId: { type: "string", description: "Account ID" },
      },
      required: ["accountId"],
    },
  },
  {
    name: "instantly_update_warmup",
    description: "Configure email inbox warmup parameters and toggle warmup mode",
    inputSchema: {
      type: "object",
      properties: {
        accountId: { type: "string", description: "Account ID" },
        enabled: { type: "boolean" },
        dailyLimit: { type: "number" },
        dailyIncrease: { type: "number" },
        replyRate: { type: "number" },
        poolOptIn: { type: "boolean" },
      },
      required: ["accountId"],
    },
  },
  {
    name: "instantly_link_account_to_campaign",
    description: "Attach or detach an email sender account to/from a campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        accountId: { type: "string" },
        action: { type: "string", enum: ["link", "unlink"] },
      },
      required: ["campaignId", "accountId", "action"],
    },
  },

  // --- Unibox & Replies ---
  {
    name: "instantly_get_unibox_threads",
    description: "Fetch incoming email replies, conversations, and interaction history across all inboxes",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["all", "unread", "starred", "archived"] },
        campaignId: { type: "string" },
        aiLabel: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "instantly_send_reply",
    description: "Send or record an email reply to a lead in Unibox",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID / Thread ID" },
        messageBody: { type: "string", description: "Email reply message text" },
        senderAccountId: { type: "string", description: "Optional specific sender account ID" },
      },
      required: ["leadId", "messageBody"],
    },
  },
  {
    name: "instantly_update_thread",
    description: "Update thread read state, star, archive, or AI categorization in Unibox",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string" },
        isRead: { type: "boolean" },
        isStarred: { type: "boolean" },
        isArchived: { type: "boolean" },
        aiLabel: { type: "string" },
      },
      required: ["leadId"],
    },
  },

  // --- Analytics & Stats ---
  {
    name: "instantly_get_analytics_overview",
    description: "Get workspace-wide email outreach statistics (total sent, opens, replies, CTR, bounces, revenue opportunity value)",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Optional workspace filter" },
      },
    },
  },
  {
    name: "instantly_get_campaign_analytics",
    description: "Get campaign-specific performance summary and daily timeline data",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
      },
      required: ["campaignId"],
    },
  },

  // --- Templates ---
  {
    name: "instantly_list_templates",
    description: "List reusable cold email templates and snippets",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string" },
        search: { type: "string" },
      },
    },
  },
  {
    name: "instantly_create_template",
    description: "Create a new reusable email template",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        category: { type: "string" },
        isPublic: { type: "boolean" },
      },
      required: ["name", "subject", "body"],
    },
  },
  {
    name: "instantly_delete_template",
    description: "Delete an email template",
    inputSchema: {
      type: "object",
      properties: {
        templateId: { type: "string" },
      },
      required: ["templateId"],
    },
  },

  // --- Settings ---
  {
    name: "instantly_get_user_settings",
    description: "Read your user preferences, AI inbox manager settings, and outreach rules",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "instantly_update_user_settings",
    description: "Update user preferences (e.g. autoTagReplies, aiInboxManager, autoPauseBounce, opportunityValue)",
    inputSchema: {
      type: "object",
      properties: {
        opportunityValue: { type: "number" },
        autoTagReplies: { type: "boolean" },
        aiInboxManager: { type: "boolean" },
        autoSuggestReplies: { type: "boolean" },
        autoPauseBounce: { type: "boolean" },
        language: { type: "string" },
      },
    },
  },
]

// Scoped tool execution logic
async function executeTool(name: string, args: any = {}, user: any) {
  if (!user) {
    throw new Error(
      "Authentication required. Please include your Instantly API key in the connection URL (e.g. https://instantly-ai.vercel.app/api/mcp?apiKey=YOUR_KEY). You can find or generate your key at https://instantly-ai.vercel.app/settings/integrations#mcp"
    )
  }

  const userId = user.id

  switch (name) {
    // --- Workspace Tools ---
    case "instantly_list_workspaces": {
      const workspaces = await prisma.workspace.findMany({
        where: {
          OR: [
            { userId },
            { members: { some: { userId } } },
          ],
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { campaignWorkspaces: true, members: true } },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
      return { total: workspaces.length, workspaces }
    }

    case "instantly_create_workspace": {
      const workspace = await prisma.workspace.create({
        data: {
          name: args.name,
          opportunityValue: args.opportunityValue ? Number(args.opportunityValue) : 1000,
          userId,
          isDefault: false,
          members: {
            create: { userId, role: "owner" },
          },
        },
      })
      return { success: true, workspaceId: workspace.id, workspace }
    }

    case "instantly_rename_workspace": {
      const workspace = await prisma.workspace.findFirst({
        where: { id: args.workspaceId, OR: [{ userId }, { members: { some: { userId, role: "owner" } } }] },
      })
      if (!workspace) throw new Error(`Workspace ${args.workspaceId} not found or you lack permission`)

      const updated = await prisma.workspace.update({
        where: { id: args.workspaceId },
        data: { name: args.name },
      })
      return { success: true, workspaceId: updated.id, name: updated.name }
    }

    case "instantly_delete_workspace": {
      const workspace = await prisma.workspace.findFirst({
        where: { id: args.workspaceId, userId },
      })
      if (!workspace) throw new Error(`Workspace ${args.workspaceId} not found or you are not the owner`)

      await prisma.workspace.delete({ where: { id: args.workspaceId } })
      return { success: true, message: `Workspace ${args.workspaceId} deleted` }
    }

    // --- Campaign Tools ---
    case "instantly_list_campaigns": {
      const where: any = { userId }
      if (args.workspaceId) {
        where.campaignWorkspaces = { some: { workspaceId: args.workspaceId } }
      }
      if (args.status && args.status !== "all") where.status = args.status
      if (args.search) where.name = { contains: args.search }
      const campaigns = await prisma.campaign.findMany({
        where,
        take: args.limit || 20,
        skip: args.offset || 0,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { leads: true, sequences: true, campaignAccounts: true } },
          tags: { include: { tag: true } },
          campaignWorkspaces: { include: { workspace: true } },
        },
      })
      return {
        total: campaigns.length,
        campaigns: campaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          workspaces: c.campaignWorkspaces.map((cw: any) => cw.workspace?.name),
          stats: {
            sent: c.sentCount,
            opens: c.openCount,
            replies: c.replyCount,
            bounces: c.bounceCount,
            openRate: c.sentCount > 0 ? `${((c.openCount / c.sentCount) * 100).toFixed(1)}%` : "0%",
            replyRate: c.sentCount > 0 ? `${((c.replyCount / c.sentCount) * 100).toFixed(1)}%` : "0%",
          },
          leadsCount: c._count.leads,
          sequencesCount: c._count.sequences,
          connectedAccountsCount: c._count.campaignAccounts,
          tags: c.tags.map((t: any) => t.tag.name),
        })),
      }
    }

    case "instantly_get_campaign": {
      const campaign = await prisma.campaign.findFirst({
        where: { id: args.campaignId, userId },
        include: {
          campaignAccounts: { include: { emailAccount: true } },
          sequences: { orderBy: { stepNumber: "asc" }, include: { variants: true } },
          tags: { include: { tag: true } },
          campaignWorkspaces: { include: { workspace: true } },
          _count: { select: { leads: true } },
        },
      })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)
      return { campaign }
    }

    case "instantly_create_campaign": {
      const campaign = await prisma.campaign.create({
        data: {
          name: args.name,
          status: "draft",
          userId,
          dailyLimit: args.dailyLimit,
          stopOnReply: args.stopOnReply ?? true,
          trackOpens: args.trackOpens ?? true,
          trackLinks: args.trackLinks ?? true,
          startTime: args.startTime || "09:00",
          endTime: args.endTime || "17:00",
          timezone: args.timezone || "UTC",
          days: args.days || "Mon,Tue,Wed,Thu,Fri",
          ...(args.workspaceId
            ? {
                campaignWorkspaces: {
                  create: [{ workspaceId: args.workspaceId }],
                },
              }
            : {}),
        },
      })
      return { success: true, campaignId: campaign.id, campaign }
    }

    case "instantly_rename_campaign": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      const updated = await prisma.campaign.update({
        where: { id: args.campaignId },
        data: { name: args.name },
      })
      return { success: true, campaignId: updated.id, name: updated.name }
    }

    case "instantly_duplicate_campaign": {
      const original = await prisma.campaign.findFirst({
        where: { id: args.campaignId, userId },
        include: {
          sequences: { include: { variants: true } },
          campaignAccounts: true,
          campaignWorkspaces: true,
        },
      })
      if (!original) throw new Error(`Source campaign ${args.campaignId} not found`)

      const newSequences = original.sequences.map((seq) => ({
        stepNumber: seq.stepNumber,
        dayGap: seq.dayGap,
        subject: seq.subject || "",
        body: seq.body || "",
        variants: {
          create: (seq.variants || []).map((v) => ({
            subject: v.subject || "",
            body: v.body || "",
            weight: v.weight ?? 50,
          })),
        },
      }))

      const cloned = await prisma.campaign.create({
        data: {
          name: args.name,
          userId,
          status: "draft",
          scheduleName: original.scheduleName,
          startTime: original.startTime,
          endTime: original.endTime,
          timezone: original.timezone,
          days: original.days,
          startDate: original.startDate,
          endDate: original.endDate,
          dailyLimit: original.dailyLimit,
          stopOnReply: original.stopOnReply,
          trackLinks: original.trackLinks,
          trackOpens: original.trackOpens,
          settings: original.settings as any,
          sequences: { create: newSequences },
          campaignWorkspaces: {
            create: original.campaignWorkspaces.map((cw) => ({ workspaceId: cw.workspaceId })),
          },
          campaignAccounts: {
            create: original.campaignAccounts.map((ca) => ({ emailAccountId: ca.emailAccountId })),
          },
        },
      })

      return { success: true, clonedCampaignId: cloned.id, campaign: cloned }
    }

    case "instantly_share_campaign_workspace": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      await prisma.campaignWorkspace.upsert({
        where: {
          campaignId_workspaceId: { campaignId: args.campaignId, workspaceId: args.workspaceId },
        },
        create: { campaignId: args.campaignId, workspaceId: args.workspaceId },
        update: {},
      })
      return { success: true, message: `Campaign shared with workspace ${args.workspaceId}` }
    }

    case "instantly_export_campaign_data": {
      const campaign = await prisma.campaign.findFirst({
        where: { id: args.campaignId, userId },
        include: {
          leads: {
            select: { id: true, email: true, firstName: true, lastName: true, company: true, phone: true, status: true, score: true, aiLabel: true },
          },
          stats: { orderBy: { date: "asc" } },
        },
      })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      return {
        campaignName: campaign.name,
        status: campaign.status,
        totalLeads: campaign.leads.length,
        leads: campaign.leads,
        dailyPerformance: campaign.stats,
      }
    }

    case "instantly_update_campaign_status": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      const updated = await prisma.campaign.update({
        where: { id: args.campaignId },
        data: { status: args.status },
      })
      return { success: true, campaignId: updated.id, status: updated.status }
    }

    case "instantly_delete_campaign": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      await prisma.campaign.delete({ where: { id: args.campaignId } })
      return { success: true, message: `Campaign ${args.campaignId} deleted` }
    }

    // --- Sequence Tools ---
    case "instantly_get_sequences": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      const sequences = await prisma.sequence.findMany({
        where: { campaignId: args.campaignId },
        orderBy: { stepNumber: "asc" },
        include: { variants: true },
      })
      return { campaignId: args.campaignId, sequences }
    }

    case "instantly_create_sequence_step": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      const count = await prisma.sequence.count({ where: { campaignId: args.campaignId } })
      const sequence = await prisma.sequence.create({
        data: {
          campaignId: args.campaignId,
          stepNumber: count + 1,
          dayGap: args.dayGap ?? 1,
          variants: {
            create: [
              {
                label: args.variantLabel || "Variant A",
                subject: args.subject || "",
                body: args.body,
                weight: 100,
                enabled: true,
              },
            ],
          },
        },
        include: { variants: true },
      })
      return { success: true, sequenceId: sequence.id, sequence }
    }

    case "instantly_update_sequence_variant": {
      const variant = await prisma.sequenceVariant.findUnique({
        where: { id: args.variantId },
        include: { sequence: { include: { campaign: true } } },
      })
      if (!variant || variant.sequence.campaign.userId !== userId) {
        throw new Error(`Variant ${args.variantId} not found in your account`)
      }

      const { variantId, ...data } = args
      const updated = await prisma.sequenceVariant.update({
        where: { id: variantId },
        data,
      })
      return { success: true, variant: updated }
    }

    case "instantly_delete_sequence_step": {
      const sequence = await prisma.sequence.findUnique({
        where: { id: args.sequenceId },
        include: { campaign: true },
      })
      if (!sequence || sequence.campaign.userId !== userId) {
        throw new Error(`Sequence step ${args.sequenceId} not found in your account`)
      }

      await prisma.sequence.delete({ where: { id: args.sequenceId } })
      return { success: true, message: `Sequence step ${args.sequenceId} deleted` }
    }

    // --- CRM & Leads ---
    case "instantly_list_leads": {
      const where: any = { campaign: { userId } }
      if (args.campaignId) where.campaignId = args.campaignId
      if (args.status && args.status !== "all") where.status = args.status
      if (args.aiLabel) where.aiLabel = args.aiLabel
      if (args.search) {
        where.OR = [
          { email: { contains: args.search } },
          { firstName: { contains: args.search } },
          { lastName: { contains: args.search } },
          { company: { contains: args.search } },
        ]
      }
      const leads = await prisma.lead.findMany({
        where,
        take: args.limit || 50,
        skip: args.offset || 0,
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { id: true, name: true } } },
      })
      return { total: leads.length, leads }
    }

    case "instantly_add_lead": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

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
      })
      return { success: true, leadId: lead.id, lead }
    }

    case "instantly_bulk_add_leads": {
      const campaign = await prisma.campaign.findFirst({ where: { id: args.campaignId, userId } })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)

      let added = 0
      for (const item of args.leads) {
        await prisma.lead.upsert({
          where: { email_campaignId: { email: item.email.toLowerCase().trim(), campaignId: args.campaignId } },
          create: {
            campaignId: args.campaignId,
            email: item.email.toLowerCase().trim(),
            firstName: item.firstName,
            lastName: item.lastName,
            company: item.company,
            website: item.website,
            phone: item.phone,
          },
          update: { firstName: item.firstName, lastName: item.lastName, company: item.company },
        })
        added++
      }
      return { success: true, totalAdded: added }
    }

    case "instantly_update_lead": {
      const lead = await prisma.lead.findUnique({
        where: { id: args.leadId },
        include: { campaign: true },
      })
      if (!lead || lead.campaign.userId !== userId) {
        throw new Error(`Lead ${args.leadId} not found in your account`)
      }

      const { leadId, ...data } = args
      const updated = await prisma.lead.update({ where: { id: leadId }, data })
      return { success: true, lead: updated }
    }

    case "instantly_delete_lead": {
      const lead = await prisma.lead.findUnique({
        where: { id: args.leadId },
        include: { campaign: true },
      })
      if (!lead || lead.campaign.userId !== userId) {
        throw new Error(`Lead ${args.leadId} not found in your account`)
      }

      await prisma.lead.delete({ where: { id: args.leadId } })
      return { success: true, message: `Lead ${args.leadId} deleted` }
    }

    // --- Accounts & Warmup ---
    case "instantly_list_accounts": {
      const where: any = { userId }
      if (args.status && args.status !== "all") where.status = args.status
      if (args.warmupEnabled !== undefined) where.warmupEnabled = args.warmupEnabled
      const accounts = await prisma.emailAccount.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { campaignAccounts: true, warmupLogs: true } } },
      })
      return { total: accounts.length, accounts }
    }

    case "instantly_add_email_account": {
      const account = await prisma.emailAccount.create({
        data: {
          email: args.email.toLowerCase().trim(),
          firstName: args.firstName,
          lastName: args.lastName,
          provider: args.provider || "custom",
          dailyLimit: args.dailyLimit || 50,
          smtpHost: args.smtpHost,
          smtpPort: args.smtpPort,
          smtpUser: args.smtpUser,
          smtpPass: args.smtpPass,
          imapHost: args.imapHost,
          imapPort: args.imapPort,
          imapUser: args.imapUser,
          imapPass: args.imapPass,
          userId,
          status: "active",
        },
      })
      return { success: true, accountId: account.id, account }
    }

    case "instantly_remove_email_account": {
      const account = await prisma.emailAccount.findFirst({ where: { id: args.accountId, userId } })
      if (!account) throw new Error(`Account ${args.accountId} not found in your account`)

      await prisma.emailAccount.delete({ where: { id: args.accountId } })
      return { success: true, message: `Account ${args.accountId} removed` }
    }

    case "instantly_get_account": {
      const account = await prisma.emailAccount.findFirst({
        where: { id: args.accountId, userId },
        include: { warmupLogs: { take: 10, orderBy: { createdAt: "desc" } }, campaignAccounts: { include: { campaign: true } } },
      })
      if (!account) throw new Error(`Account ${args.accountId} not found in your account`)
      return { account }
    }

    case "instantly_update_warmup": {
      const account = await prisma.emailAccount.findFirst({ where: { id: args.accountId, userId } })
      if (!account) throw new Error(`Account ${args.accountId} not found in your account`)

      const { accountId, ...data } = args
      const updateData: any = {}
      if (data.enabled !== undefined) updateData.warmupEnabled = data.enabled
      if (data.dailyLimit !== undefined) updateData.warmupDailyLimit = data.dailyLimit
      if (data.dailyIncrease !== undefined) updateData.warmupDailyIncrease = data.dailyIncrease
      if (data.replyRate !== undefined) updateData.warmupReplyRate = data.replyRate
      if (data.poolOptIn !== undefined) updateData.warmupPoolOptIn = data.poolOptIn
      const updated = await prisma.emailAccount.update({ where: { id: accountId }, data: updateData })
      return { success: true, account: updated }
    }

    case "instantly_link_account_to_campaign": {
      const [campaign, account] = await Promise.all([
        prisma.campaign.findFirst({ where: { id: args.campaignId, userId } }),
        prisma.emailAccount.findFirst({ where: { id: args.accountId, userId } }),
      ])
      if (!campaign || !account) {
        throw new Error("Campaign or Email Account not found in your account")
      }

      if (args.action === "link") {
        await prisma.campaignEmailAccount.upsert({
          where: { campaignId_emailAccountId: { campaignId: args.campaignId, emailAccountId: args.accountId } },
          create: { campaignId: args.campaignId, emailAccountId: args.accountId },
          update: {},
        })
      } else {
        await prisma.campaignEmailAccount.deleteMany({
          where: { campaignId: args.campaignId, emailAccountId: args.accountId },
        })
      }
      return { success: true, action: args.action }
    }

    // --- Unibox & Replies ---
    case "instantly_get_unibox_threads": {
      const leads = await prisma.lead.findMany({
        where: { campaign: { userId } },
        take: args.limit || 30,
        orderBy: { updatedAt: "desc" },
        include: { campaign: true, events: { take: 5, orderBy: { createdAt: "desc" } } },
      })
      return { threads: leads }
    }

    case "instantly_send_reply": {
      const lead = await prisma.lead.findUnique({
        where: { id: args.leadId },
        include: { campaign: true },
      })
      if (!lead || lead.campaign.userId !== userId) {
        throw new Error(`Lead ${args.leadId} not found in your account`)
      }

      const event = await prisma.sendingEvent.create({
        data: {
          type: "reply",
          leadId: lead.id,
          campaignId: lead.campaignId,
          emailAccountId: args.senderAccountId,
          details: args.messageBody,
        },
      })

      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "replied", isRead: true },
      })

      return { success: true, message: `Reply recorded for ${lead.email}`, eventId: event.id }
    }

    case "instantly_update_thread": {
      const lead = await prisma.lead.findUnique({
        where: { id: args.leadId },
        include: { campaign: true },
      })
      if (!lead || lead.campaign.userId !== userId) {
        throw new Error(`Thread/lead ${args.leadId} not found in your account`)
      }

      const { leadId, ...data } = args
      const updated = await prisma.lead.update({ where: { id: leadId }, data })
      return { success: true, lead: updated }
    }

    // --- Analytics & Stats ---
    case "instantly_get_analytics_overview": {
      const whereCampaign: any = { userId }
      if (args.workspaceId) {
        whereCampaign.campaignWorkspaces = { some: { workspaceId: args.workspaceId } }
      }

      const [campaigns, accountsCount, leadsCount, userPref] = await Promise.all([
        prisma.campaign.findMany({
          where: whereCampaign,
          select: { sentCount: true, openCount: true, replyCount: true, bounceCount: true },
        }),
        prisma.emailAccount.count({ where: { userId } }),
        prisma.lead.count({ where: { campaign: whereCampaign } }),
        prisma.userPreference.findUnique({ where: { userId } }),
      ])

      const totalSent = campaigns.reduce((a: number, c: any) => a + c.sentCount, 0)
      const totalOpens = campaigns.reduce((a: number, c: any) => a + c.openCount, 0)
      const totalReplies = campaigns.reduce((a: number, c: any) => a + c.replyCount, 0)
      const totalBounces = campaigns.reduce((a: number, c: any) => a + c.bounceCount, 0)
      const oppValue = userPref?.opportunityValue || 1000
      const pipelineValue = totalReplies * oppValue

      return {
        summary: {
          totalCampaigns: campaigns.length,
          totalAccounts: accountsCount,
          totalLeads: leadsCount,
          totalSent,
          totalOpens,
          totalReplies,
          totalBounces,
          pipelineOpportunityValue: `$${pipelineValue.toLocaleString()}`,
          openRate: totalSent > 0 ? `${((totalOpens / totalSent) * 100).toFixed(1)}%` : "0%",
          replyRate: totalSent > 0 ? `${((totalReplies / totalSent) * 100).toFixed(1)}%` : "0%",
          bounceRate: totalSent > 0 ? `${((totalBounces / totalSent) * 100).toFixed(1)}%` : "0%",
        },
      }
    }

    case "instantly_get_campaign_analytics": {
      const campaign = await prisma.campaign.findFirst({
        where: { id: args.campaignId, userId },
        include: { stats: { orderBy: { date: "asc" } } },
      })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found in your account`)
      return { campaign }
    }

    // --- Templates ---
    case "instantly_list_templates": {
      const templates = await prisma.template.findMany({
        where: { OR: [{ userId }, { isPublic: true }] },
        orderBy: { updatedAt: "desc" },
      })
      return { total: templates.length, templates }
    }

    case "instantly_create_template": {
      const template = await prisma.template.create({
        data: {
          name: args.name,
          subject: args.subject,
          body: args.body,
          category: args.category || "General",
          isPublic: args.isPublic ?? false,
          userId,
        },
      })
      return { success: true, template }
    }

    case "instantly_delete_template": {
      const template = await prisma.template.findFirst({ where: { id: args.templateId, userId } })
      if (!template) throw new Error(`Template ${args.templateId} not found in your account`)

      await prisma.template.delete({ where: { id: args.templateId } })
      return { success: true, message: `Template ${args.templateId} deleted` }
    }

    // --- Settings Tools ---
    case "instantly_get_user_settings": {
      const prefs = await prisma.userPreference.findUnique({
        where: { userId },
      })
      return { settings: prefs || {} }
    }

    case "instantly_update_user_settings": {
      const updated = await prisma.userPreference.upsert({
        where: { userId },
        create: { userId, ...args },
        update: args,
      })
      return { success: true, settings: updated }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// CORS Headers helper
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-session-id, Accept",
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  const acceptHeader = req.headers.get("accept") || ""
  const user = await resolveUser(req)

  if (acceptHeader.includes("text/event-stream")) {
    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: endpoint\ndata: /api/mcp?sessionId=default\n\n`))
      },
    })

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...corsHeaders(),
      },
    })
  }

  return NextResponse.json(
    {
      status: "healthy",
      name: "instantly-mcp-server",
      version: "1.0.0",
      protocol: "mcp",
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      toolsCount: tools.length,
      endpoints: {
        sse: "/api/mcp",
        jsonrpc: "/api/mcp",
      },
      tools: tools.map((t) => ({ name: t.name, description: t.description })),
    },
    { headers: corsHeaders() }
  )
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req)
    const body = await req.json()
    const { jsonrpc, id, method, params = {} } = body

    if (method === "initialize") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {}, prompts: {} },
            serverInfo: {
              name: "instantly-mcp-server",
              version: "1.0.0",
              authenticated: !!user,
            },
          },
        },
        { headers: corsHeaders() }
      )
    }

    if (method === "ping") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: corsHeaders() })
    }

    if (method === "tools/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: { tools },
        },
        { headers: corsHeaders() }
      )
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params
      try {
        const result = await executeTool(name, args, user)
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          },
          { headers: corsHeaders() }
        )
      } catch (err: any) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              isError: true,
              content: [{ type: "text", text: `Error: ${err.message || String(err)}` }],
            },
          },
          { headers: corsHeaders() }
        )
      }
    }

    if (method === "resources/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            resources: [
              { uri: "instantly://campaigns", name: "Campaigns List", mimeType: "application/json" },
              { uri: "instantly://analytics/summary", name: "Analytics Summary", mimeType: "application/json" },
            ],
          },
        },
        { headers: corsHeaders() }
      )
    }

    if (method === "prompts/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            prompts: [
              { name: "instantly_draft_cold_email_sequence", description: "Draft converting cold email sequences" },
              { name: "instantly_analyze_campaign_performance", description: "Diagnose campaign open & reply rates" },
            ],
          },
        },
        { headers: corsHeaders() }
      )
    }

    return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: corsHeaders() })
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: error.message || "Internal server error" },
      },
      { status: 500, headers: corsHeaders() }
    )
  }
}
