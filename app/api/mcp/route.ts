import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// 25 MCP Tool Definitions
const tools = [
  // Campaign Tools
  {
    name: "instantly_list_campaigns",
    description: "List outreach campaigns with status, sending stats, tags, and progress",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["draft", "active", "paused", "completed", "all"], description: "Filter by status" },
        search: { type: "string", description: "Search by campaign name" },
        limit: { type: "number", description: "Limit results (default 20)" },
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
        campaignId: { type: "string", description: "The campaign ID" },
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

  // Sequence Tools
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

  // Lead Tools
  {
    name: "instantly_list_leads",
    description: "List and search leads with status and AI sentiment filtering",
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
    description: "Add an individual lead into a campaign with custom variables",
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
    description: "Update lead status, score, or Unibox metadata",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID" },
        status: { type: "string", enum: ["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead"] },
        score: { type: "number", description: "Score (0-100)" },
        aiLabel: { type: "string", description: "AI classification label" },
        isStarred: { type: "boolean" },
        isArchived: { type: "boolean" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "instantly_delete_lead",
    description: "Remove a lead from a campaign",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to delete" },
      },
      required: ["leadId"],
    },
  },

  // Account & Warmup Tools
  {
    name: "instantly_list_accounts",
    description: "List sender inboxes with warmup status, scores, and daily dispatch counts",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["active", "paused", "error", "all"] },
        warmupEnabled: { type: "boolean" },
      },
    },
  },
  {
    name: "instantly_get_account",
    description: "Get detailed account settings, warmup history, and attached campaigns",
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
    description: "Configure email inbox warmup parameters and toggle warmup",
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

  // Unibox Tools
  {
    name: "instantly_get_unibox_threads",
    description: "Fetch incoming replies and interactions across all sender inboxes",
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

  // Analytics Tools
  {
    name: "instantly_get_analytics_overview",
    description: "Get workspace-wide metrics (total sent, opens, replies, CTR, bounces, and top campaigns)",
    inputSchema: {
      type: "object",
      properties: {},
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

  // Template Tools
  {
    name: "instantly_list_templates",
    description: "List reusable cold email templates",
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
    description: "Create a new email template with subject and body variables",
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
]

// Tool execution logic
async function executeTool(name: string, args: any = {}) {
  switch (name) {
    case "instantly_list_campaigns": {
      const where: any = {}
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
        },
      })
      return {
        total: campaigns.length,
        campaigns: campaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status,
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
      const campaign = await prisma.campaign.findUnique({
        where: { id: args.campaignId },
        include: {
          campaignAccounts: { include: { emailAccount: true } },
          sequences: { orderBy: { stepNumber: "asc" }, include: { variants: true } },
          tags: { include: { tag: true } },
          _count: { select: { leads: true } },
        },
      })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found`)
      return { campaign }
    }

    case "instantly_create_campaign": {
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
        },
      })
      return { success: true, campaignId: campaign.id, campaign }
    }

    case "instantly_update_campaign_status": {
      const campaign = await prisma.campaign.update({
        where: { id: args.campaignId },
        data: { status: args.status },
      })
      return { success: true, campaignId: campaign.id, status: campaign.status }
    }

    case "instantly_delete_campaign": {
      await prisma.campaign.delete({ where: { id: args.campaignId } })
      return { success: true, message: `Campaign ${args.campaignId} deleted` }
    }

    case "instantly_get_sequences": {
      const sequences = await prisma.sequence.findMany({
        where: { campaignId: args.campaignId },
        orderBy: { stepNumber: "asc" },
        include: { variants: true },
      })
      return { campaignId: args.campaignId, sequences }
    }

    case "instantly_create_sequence_step": {
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
      const { variantId, ...data } = args
      const variant = await prisma.sequenceVariant.update({
        where: { id: variantId },
        data,
      })
      return { success: true, variant }
    }

    case "instantly_delete_sequence_step": {
      await prisma.sequence.delete({ where: { id: args.sequenceId } })
      return { success: true, message: `Sequence step ${args.sequenceId} deleted` }
    }

    case "instantly_list_leads": {
      const where: any = {}
      if (args.campaignId) where.campaignId = args.campaignId
      if (args.status && args.status !== "all") where.status = args.status
      if (args.aiLabel) where.aiLabel = args.aiLabel
      if (args.search) {
        where.OR = [
          { email: { contains: args.search } },
          { firstName: { contains: args.search } },
          { company: { contains: args.search } },
        ]
      }
      const leads = await prisma.lead.findMany({
        where,
        take: args.limit || 50,
        skip: args.offset || 0,
        orderBy: { createdAt: "desc" },
      })
      return { total: leads.length, leads }
    }

    case "instantly_add_lead": {
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
      let added = 0
      for (const item of args.leads) {
        await prisma.lead.upsert({
          where: { email_campaignId: { email: item.email.toLowerCase().trim(), campaignId: args.campaignId } },
          create: { campaignId: args.campaignId, email: item.email.toLowerCase().trim(), firstName: item.firstName, lastName: item.lastName, company: item.company },
          update: { firstName: item.firstName, lastName: item.lastName, company: item.company },
        })
        added++
      }
      return { success: true, totalAdded: added }
    }

    case "instantly_update_lead": {
      const { leadId, ...data } = args
      const lead = await prisma.lead.update({ where: { id: leadId }, data })
      return { success: true, lead }
    }

    case "instantly_delete_lead": {
      await prisma.lead.delete({ where: { id: args.leadId } })
      return { success: true, message: `Lead ${args.leadId} deleted` }
    }

    case "instantly_list_accounts": {
      const where: any = {}
      if (args.status && args.status !== "all") where.status = args.status
      if (args.warmupEnabled !== undefined) where.warmupEnabled = args.warmupEnabled
      const accounts = await prisma.emailAccount.findMany({ where, orderBy: { createdAt: "desc" } })
      return { total: accounts.length, accounts }
    }

    case "instantly_get_account": {
      const account = await prisma.emailAccount.findUnique({
        where: { id: args.accountId },
        include: { warmupLogs: { take: 10, orderBy: { createdAt: "desc" } } },
      })
      if (!account) throw new Error(`Account ${args.accountId} not found`)
      return { account }
    }

    case "instantly_update_warmup": {
      const { accountId, ...data } = args
      const updateData: any = {}
      if (data.enabled !== undefined) updateData.warmupEnabled = data.enabled
      if (data.dailyLimit !== undefined) updateData.warmupDailyLimit = data.dailyLimit
      if (data.dailyIncrease !== undefined) updateData.warmupDailyIncrease = data.dailyIncrease
      if (data.replyRate !== undefined) updateData.warmupReplyRate = data.replyRate
      if (data.poolOptIn !== undefined) updateData.warmupPoolOptIn = data.poolOptIn
      const account = await prisma.emailAccount.update({ where: { id: accountId }, data: updateData })
      return { success: true, account }
    }

    case "instantly_link_account_to_campaign": {
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

    case "instantly_get_unibox_threads": {
      const leads = await prisma.lead.findMany({
        take: args.limit || 30,
        orderBy: { updatedAt: "desc" },
        include: { campaign: true, events: { take: 5, orderBy: { createdAt: "desc" } } },
      })
      return { threads: leads }
    }

    case "instantly_update_thread": {
      const { leadId, ...data } = args
      const lead = await prisma.lead.update({ where: { id: leadId }, data })
      return { success: true, lead }
    }

    case "instantly_get_analytics_overview": {
      const [campaigns, accountsCount, leadsCount] = await Promise.all([
        prisma.campaign.findMany({ select: { sentCount: true, openCount: true, replyCount: true, bounceCount: true } }),
        prisma.emailAccount.count(),
        prisma.lead.count(),
      ])
      const totalSent = campaigns.reduce((a: number, c: any) => a + c.sentCount, 0)
      const totalOpens = campaigns.reduce((a: number, c: any) => a + c.openCount, 0)
      const totalReplies = campaigns.reduce((a: number, c: any) => a + c.replyCount, 0)
      return {
        summary: {
          totalCampaigns: campaigns.length,
          totalAccounts: accountsCount,
          totalLeads: leadsCount,
          totalSent,
          totalOpens,
          totalReplies,
          openRate: totalSent > 0 ? `${((totalOpens / totalSent) * 100).toFixed(1)}%` : "0%",
          replyRate: totalSent > 0 ? `${((totalReplies / totalSent) * 100).toFixed(1)}%` : "0%",
        },
      }
    }

    case "instantly_get_campaign_analytics": {
      const campaign = await prisma.campaign.findUnique({
        where: { id: args.campaignId },
        include: { stats: { orderBy: { date: "asc" } } },
      })
      if (!campaign) throw new Error(`Campaign ${args.campaignId} not found`)
      return { campaign }
    }

    case "instantly_list_templates": {
      const templates = await prisma.template.findMany({ orderBy: { updatedAt: "desc" } })
      return { total: templates.length, templates }
    }

    case "instantly_create_template": {
      const user = await prisma.user.findFirst()
      const template = await prisma.template.create({
        data: {
          name: args.name,
          subject: args.subject,
          body: args.body,
          category: args.category || "General",
          isPublic: args.isPublic ?? false,
          userId: user?.id,
        },
      })
      return { success: true, template }
    }

    case "instantly_delete_template": {
      await prisma.template.delete({ where: { id: args.templateId } })
      return { success: true, message: `Template ${args.templateId} deleted` }
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-id, Accept",
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  const acceptHeader = req.headers.get("accept") || ""
  
  // If client requests SSE stream
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

  // Health and metadata discovery response
  return NextResponse.json(
    {
      status: "healthy",
      name: "instantly-mcp-server",
      version: "1.0.0",
      protocol: "mcp",
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
    const body = await req.json()
    const { jsonrpc, id, method, params = {} } = body

    // 1. Initialize
    if (method === "initialize") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {}, prompts: {} },
            serverInfo: { name: "instantly-mcp-server", version: "1.0.0" },
          },
        },
        { headers: corsHeaders() }
      )
    }

    // 2. Ping
    if (method === "ping") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: corsHeaders() })
    }

    // 3. Tools List
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

    // 4. Tools Call
    if (method === "tools/call") {
      const { name, arguments: args } = params
      try {
        const result = await executeTool(name, args)
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

    // 5. Resources List
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

    // 6. Prompts List
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

    // Fallback for notifications / unhandled methods
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        result: {},
      },
      { headers: corsHeaders() }
    )
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
