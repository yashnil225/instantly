import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js"
import { prisma } from "./db.js"
import { resourcesList, readResource } from "./resources/index.js"
import { promptsList, getPromptMessages } from "./prompts/index.js"

export const tools = [
  // --- Workspace Tools ---
  {
    name: "instantly_list_workspaces",
    description: "List all workspaces you own or belong to with member & campaign counts",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "instantly_create_workspace",
    description: "Create a new workspace organization",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Workspace name" },
        opportunityValue: { type: "number", description: "Default lead opportunity value in USD" },
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
    description: "List outreach campaigns with filters, progress stats, and tag associations",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Filter by workspace" },
        status: { type: "string", enum: ["draft", "active", "paused", "completed", "all"] },
        search: { type: "string" },
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
  },
  {
    name: "instantly_get_campaign",
    description: "Retrieve complete details for a campaign, including schedule, sequences, and attached accounts",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" } },
      required: ["campaignId"],
    },
  },
  {
    name: "instantly_create_campaign",
    description: "Create a new cold outreach campaign with schedule, sending window, and tracking options",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        workspaceId: { type: "string" },
        dailyLimit: { type: "number" },
        stopOnReply: { type: "boolean" },
        trackOpens: { type: "boolean" },
        trackLinks: { type: "boolean" },
        startTime: { type: "string" },
        endTime: { type: "string" },
        timezone: { type: "string" },
        days: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "instantly_rename_campaign",
    description: "Rename a campaign",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" }, name: { type: "string" } },
      required: ["campaignId", "name"],
    },
  },
  {
    name: "instantly_duplicate_campaign",
    description: "Duplicate a campaign with all its email sequences, variants, schedule, and account settings",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" }, name: { type: "string" } },
      required: ["campaignId", "name"],
    },
  },
  {
    name: "instantly_share_campaign_workspace",
    description: "Share or link a campaign to a workspace",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" }, workspaceId: { type: "string" } },
      required: ["campaignId", "workspaceId"],
    },
  },
  {
    name: "instantly_export_campaign_data",
    description: "Export all campaign leads and performance statistics",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" } },
      required: ["campaignId"],
    },
  },
  {
    name: "instantly_update_campaign_status",
    description: "Update campaign status (draft, active, paused, completed)",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" }, status: { type: "string", enum: ["draft", "active", "paused", "completed"] } },
      required: ["campaignId", "status"],
    },
  },
  {
    name: "instantly_delete_campaign",
    description: "Delete an outreach campaign and its associated sequences and leads",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" } },
      required: ["campaignId"],
    },
  },

  // --- Sequences ---
  {
    name: "instantly_get_sequences",
    description: "Get all sequence steps and A/B test variants for a campaign",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" } },
      required: ["campaignId"],
    },
  },
  {
    name: "instantly_create_sequence_step",
    description: "Add a new email follow-up step to a campaign sequence",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        dayGap: { type: "number" },
        subject: { type: "string" },
        body: { type: "string" },
        variantLabel: { type: "string" },
      },
      required: ["campaignId", "body"],
    },
  },
  {
    name: "instantly_update_sequence_variant",
    description: "Update copy, subject line, or traffic weight for a sequence variant",
    inputSchema: {
      type: "object",
      properties: {
        variantId: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        weight: { type: "number" },
        enabled: { type: "boolean" },
      },
      required: ["variantId"],
    },
  },
  {
    name: "instantly_delete_sequence_step",
    description: "Delete a sequence step from a campaign",
    inputSchema: {
      type: "object",
      properties: { sequenceId: { type: "string" } },
      required: ["sequenceId"],
    },
  },

  // --- CRM & Leads ---
  {
    name: "instantly_list_leads",
    description: "List and search leads across campaigns with status and AI sentiment filtering",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        status: { type: "string", enum: ["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead", "all"] },
        search: { type: "string" },
        aiLabel: { type: "string" },
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
  },
  {
    name: "instantly_add_lead",
    description: "Add an individual lead into a campaign with custom CRM variables",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        email: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        company: { type: "string" },
        website: { type: "string" },
        phone: { type: "string" },
        customFields: { type: "object" },
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
        campaignId: { type: "string" },
        leads: {
          type: "array",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              company: { type: "string" },
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
        leadId: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        company: { type: "string" },
        website: { type: "string" },
        phone: { type: "string" },
        status: { type: "string", enum: ["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead"] },
        score: { type: "number" },
        aiLabel: { type: "string" },
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
      properties: { leadId: { type: "string" } },
      required: ["leadId"],
    },
  },

  // --- Accounts & Warmup ---
  {
    name: "instantly_list_accounts",
    description: "List email accounts with warmup status, reputation scores, and daily dispatch counts",
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
    description: "Connect a new sender email account",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        provider: { type: "string" },
        dailyLimit: { type: "number" },
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
      properties: { accountId: { type: "string" } },
      required: ["accountId"],
    },
  },
  {
    name: "instantly_get_account",
    description: "Get detailed account settings, credentials provider, warmup history, and attached campaigns",
    inputSchema: {
      type: "object",
      properties: { accountId: { type: "string" } },
      required: ["accountId"],
    },
  },
  {
    name: "instantly_update_warmup",
    description: "Configure email inbox warmup parameters and toggle warmup",
    inputSchema: {
      type: "object",
      properties: {
        accountId: { type: "string" },
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
    description: "Link or unlink an email sender account to/from a campaign",
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
        leadId: { type: "string" },
        messageBody: { type: "string" },
        senderAccountId: { type: "string" },
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

  // --- Analytics ---
  {
    name: "instantly_get_analytics_overview",
    description: "Get workspace-level cold email metrics (total sent, opens, replies, CTR, bounces, revenue opportunity)",
    inputSchema: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
  },
  {
    name: "instantly_get_campaign_analytics",
    description: "Get campaign-specific performance summary and daily timeline data",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" } },
      required: ["campaignId"],
    },
  },

  // --- Templates ---
  {
    name: "instantly_list_templates",
    description: "List reusable cold email templates and snippets",
    inputSchema: {
      type: "object",
      properties: { category: { type: "string" }, search: { type: "string" } },
    },
  },
  {
    name: "instantly_create_template",
    description: "Create a new reusable email template with subject and body variables",
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
      properties: { templateId: { type: "string" } },
      required: ["templateId"],
    },
  },

  // --- Settings ---
  {
    name: "instantly_get_user_settings",
    description: "Read your user preferences and outreach configuration",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "instantly_update_user_settings",
    description: "Update user preferences (autoTagReplies, aiInboxManager, autoPauseBounce, opportunityValue)",
    inputSchema: {
      type: "object",
      properties: {
        opportunityValue: { type: "number" },
        autoTagReplies: { type: "boolean" },
        aiInboxManager: { type: "boolean" },
        autoSuggestReplies: { type: "boolean" },
        autoPauseBounce: { type: "boolean" },
      },
    },
  },
]

export function createMcpServer() {
  const server = new Server(
    { name: "instantly-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params

    try {
      let result: any
      const user = await prisma.user.findFirst()
      const userId = user?.id

      switch (name) {
        // Workspace
        case "instantly_list_workspaces":
          result = await prisma.workspace.findMany({ include: { _count: { select: { campaignWorkspaces: true, members: true } } } })
          break
        case "instantly_create_workspace":
          result = await prisma.workspace.create({
            data: {
              name: (args as any).name,
              opportunityValue: (args as any).opportunityValue || 1000,
              userId,
              members: userId ? { create: { userId, role: "owner" } } : undefined,
            },
          })
          break
        case "instantly_rename_workspace":
          result = await prisma.workspace.update({ where: { id: (args as any).workspaceId }, data: { name: (args as any).name } })
          break
        case "instantly_delete_workspace":
          result = await prisma.workspace.delete({ where: { id: (args as any).workspaceId } })
          break

        // Campaigns
        case "instantly_list_campaigns": {
          const where: any = {}
          if ((args as any).workspaceId) where.campaignWorkspaces = { some: { workspaceId: (args as any).workspaceId } }
          if ((args as any).status && (args as any).status !== "all") where.status = (args as any).status
          if ((args as any).search) where.name = { contains: (args as any).search }
          const campaigns = await prisma.campaign.findMany({
            where,
            take: (args as any).limit || 20,
            skip: (args as any).offset || 0,
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { leads: true, sequences: true, campaignAccounts: true } } },
          })
          result = { total: campaigns.length, campaigns }
          break
        }
        case "instantly_get_campaign":
          result = await prisma.campaign.findUnique({
            where: { id: (args as any).campaignId },
            include: { sequences: { include: { variants: true } }, campaignAccounts: { include: { emailAccount: true } }, _count: { select: { leads: true } } },
          })
          break
        case "instantly_create_campaign":
          result = await prisma.campaign.create({
            data: {
              name: (args as any).name,
              userId,
              status: "draft",
              dailyLimit: (args as any).dailyLimit,
              stopOnReply: (args as any).stopOnReply ?? true,
              trackOpens: (args as any).trackOpens ?? true,
              trackLinks: (args as any).trackLinks ?? true,
              startTime: (args as any).startTime || "09:00",
              endTime: (args as any).endTime || "17:00",
              timezone: (args as any).timezone || "UTC",
              days: (args as any).days || "Mon,Tue,Wed,Thu,Fri",
            },
          })
          break
        case "instantly_rename_campaign":
          result = await prisma.campaign.update({ where: { id: (args as any).campaignId }, data: { name: (args as any).name } })
          break
        case "instantly_duplicate_campaign": {
          const original = await prisma.campaign.findUnique({
            where: { id: (args as any).campaignId },
            include: { sequences: { include: { variants: true } }, campaignAccounts: true, campaignWorkspaces: true },
          })
          if (!original) throw new Error("Source campaign not found")
          const newSequences = original.sequences.map((seq) => ({
            stepNumber: seq.stepNumber,
            dayGap: seq.dayGap,
            subject: seq.subject || "",
            body: seq.body || "",
            variants: {
              create: (seq.variants || []).map((v) => ({ subject: v.subject || "", body: v.body || "", weight: v.weight ?? 50 })),
            },
          }))
          result = await prisma.campaign.create({
            data: {
              name: (args as any).name,
              userId: original.userId,
              status: "draft",
              dailyLimit: original.dailyLimit,
              stopOnReply: original.stopOnReply,
              trackOpens: original.trackOpens,
              trackLinks: original.trackLinks,
              startTime: original.startTime,
              endTime: original.endTime,
              timezone: original.timezone,
              days: original.days,
              sequences: { create: newSequences },
            },
          })
          break
        }
        case "instantly_share_campaign_workspace":
          result = await prisma.campaignWorkspace.upsert({
            where: { campaignId_workspaceId: { campaignId: (args as any).campaignId, workspaceId: (args as any).workspaceId } },
            create: { campaignId: (args as any).campaignId, workspaceId: (args as any).workspaceId },
            update: {},
          })
          break
        case "instantly_export_campaign_data":
          result = await prisma.campaign.findUnique({
            where: { id: (args as any).campaignId },
            include: { leads: true, stats: true },
          })
          break
        case "instantly_update_campaign_status":
          result = await prisma.campaign.update({ where: { id: (args as any).campaignId }, data: { status: (args as any).status } })
          break
        case "instantly_delete_campaign":
          result = await prisma.campaign.delete({ where: { id: (args as any).campaignId } })
          break

        // Sequences
        case "instantly_get_sequences":
          result = await prisma.sequence.findMany({ where: { campaignId: (args as any).campaignId }, include: { variants: true } })
          break
        case "instantly_create_sequence_step": {
          const count = await prisma.sequence.count({ where: { campaignId: (args as any).campaignId } })
          result = await prisma.sequence.create({
            data: {
              campaignId: (args as any).campaignId,
              stepNumber: count + 1,
              dayGap: (args as any).dayGap ?? 1,
              variants: {
                create: [{ label: (args as any).variantLabel || "Variant A", subject: (args as any).subject || "", body: (args as any).body, weight: 100, enabled: true }],
              },
            },
            include: { variants: true },
          })
          break
        }
        case "instantly_update_sequence_variant": {
          const { variantId, ...data } = args as any
          result = await prisma.sequenceVariant.update({ where: { id: variantId }, data })
          break
        }
        case "instantly_delete_sequence_step":
          result = await prisma.sequence.delete({ where: { id: (args as any).sequenceId } })
          break

        // CRM & Leads
        case "instantly_list_leads": {
          const where: any = {}
          if ((args as any).campaignId) where.campaignId = (args as any).campaignId
          if ((args as any).status && (args as any).status !== "all") where.status = (args as any).status
          if ((args as any).aiLabel) where.aiLabel = (args as any).aiLabel
          if ((args as any).search) {
            where.OR = [{ email: { contains: (args as any).search } }, { company: { contains: (args as any).search } }]
          }
          result = await prisma.lead.findMany({ where, take: (args as any).limit || 50, skip: (args as any).offset || 0, orderBy: { createdAt: "desc" } })
          break
        }
        case "instantly_add_lead":
          result = await prisma.lead.create({
            data: {
              campaignId: (args as any).campaignId,
              email: (args as any).email.toLowerCase().trim(),
              firstName: (args as any).firstName,
              lastName: (args as any).lastName,
              company: (args as any).company,
              website: (args as any).website,
              phone: (args as any).phone,
              customFields: (args as any).customFields ? JSON.stringify((args as any).customFields) : null,
              status: "new",
            },
          })
          break
        case "instantly_bulk_add_leads": {
          let count = 0
          for (const l of (args as any).leads) {
            await prisma.lead.upsert({
              where: { email_campaignId: { email: l.email.toLowerCase().trim(), campaignId: (args as any).campaignId } },
              create: { campaignId: (args as any).campaignId, email: l.email.toLowerCase().trim(), firstName: l.firstName, lastName: l.lastName, company: l.company },
              update: { firstName: l.firstName, lastName: l.lastName, company: l.company },
            })
            count++
          }
          result = { success: true, added: count }
          break
        }
        case "instantly_update_lead": {
          const { leadId, ...data } = args as any
          result = await prisma.lead.update({ where: { id: leadId }, data })
          break
        }
        case "instantly_delete_lead":
          result = await prisma.lead.delete({ where: { id: (args as any).leadId } })
          break

        // Accounts & Deliverability
        case "instantly_list_accounts":
          result = await prisma.emailAccount.findMany({ orderBy: { createdAt: "desc" } })
          break
        case "instantly_add_email_account":
          result = await prisma.emailAccount.create({
            data: {
              email: (args as any).email.toLowerCase().trim(),
              firstName: (args as any).firstName,
              lastName: (args as any).lastName,
              provider: (args as any).provider || "custom",
              dailyLimit: (args as any).dailyLimit || 50,
              userId,
              status: "active",
            },
          })
          break
        case "instantly_remove_email_account":
          result = await prisma.emailAccount.delete({ where: { id: (args as any).accountId } })
          break
        case "instantly_get_account":
          result = await prisma.emailAccount.findUnique({ where: { id: (args as any).accountId }, include: { warmupLogs: { take: 10 } } })
          break
        case "instantly_update_warmup": {
          const { accountId, ...data } = args as any
          const updateData: any = {}
          if (data.enabled !== undefined) updateData.warmupEnabled = data.enabled
          if (data.dailyLimit !== undefined) updateData.warmupDailyLimit = data.dailyLimit
          if (data.dailyIncrease !== undefined) updateData.warmupDailyIncrease = data.dailyIncrease
          if (data.replyRate !== undefined) updateData.warmupReplyRate = data.replyRate
          if (data.poolOptIn !== undefined) updateData.warmupPoolOptIn = data.poolOptIn
          result = await prisma.emailAccount.update({ where: { id: accountId }, data: updateData })
          break
        }
        case "instantly_link_account_to_campaign":
          if ((args as any).action === "link") {
            result = await prisma.campaignEmailAccount.upsert({
              where: { campaignId_emailAccountId: { campaignId: (args as any).campaignId, emailAccountId: (args as any).accountId } },
              create: { campaignId: (args as any).campaignId, emailAccountId: (args as any).accountId },
              update: {},
            })
          } else {
            result = await prisma.campaignEmailAccount.deleteMany({
              where: { campaignId: (args as any).campaignId, emailAccountId: (args as any).accountId },
            })
          }
          break

        // Unibox & Replies
        case "instantly_get_unibox_threads":
          result = await prisma.lead.findMany({ take: (args as any).limit || 30, include: { campaign: true, events: { take: 5 } } })
          break
        case "instantly_send_reply":
          result = await prisma.sendingEvent.create({
            data: {
              type: "reply",
              leadId: (args as any).leadId,
              campaignId: "unibox",
              details: (args as any).messageBody,
            },
          })
          break
        case "instantly_update_thread": {
          const { leadId, ...data } = args as any
          result = await prisma.lead.update({ where: { id: leadId }, data })
          break
        }

        // Analytics
        case "instantly_get_analytics_overview": {
          const campaigns = await prisma.campaign.findMany()
          const totalSent = campaigns.reduce((a, c) => a + c.sentCount, 0)
          const totalOpens = campaigns.reduce((a, c) => a + c.openCount, 0)
          const totalReplies = campaigns.reduce((a, c) => a + c.replyCount, 0)
          result = { totalCampaigns: campaigns.length, totalSent, totalOpens, totalReplies }
          break
        }
        case "instantly_get_campaign_analytics":
          result = await prisma.campaign.findUnique({ where: { id: (args as any).campaignId }, include: { stats: true } })
          break

        // Templates
        case "instantly_list_templates":
          result = await prisma.template.findMany()
          break
        case "instantly_create_template":
          result = await prisma.template.create({ data: { name: (args as any).name, subject: (args as any).subject, body: (args as any).body, userId } })
          break
        case "instantly_delete_template":
          result = await prisma.template.delete({ where: { id: (args as any).templateId } })
          break

        // Settings
        case "instantly_get_user_settings":
          result = await prisma.userPreference.findFirst()
          break
        case "instantly_update_user_settings":
          result = await prisma.userPreference.updateMany({ data: args as any })
          break

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
      }

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
    } catch (error: any) {
      return { isError: true, content: [{ type: "text", text: `Error: ${error.message || String(error)}` }] }
    }
  })

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: resourcesList }))
  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const r = await readResource(req.params.uri)
    return { contents: [{ uri: r.uri, mimeType: r.mimeType, text: r.text }] }
  })
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: promptsList }))
  server.setRequestHandler(GetPromptRequestSchema, async (req) => ({ messages: getPromptMessages(req.params.name, req.params.arguments || {}) }))

  return server
}
