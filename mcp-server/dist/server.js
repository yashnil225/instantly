import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { handleListCampaigns, handleGetCampaign, handleCreateCampaign, handleUpdateCampaignStatus, handleDeleteCampaign, } from "./tools/campaigns.js";
import { handleListLeads, handleAddLead, handleBulkAddLeads, handleUpdateLead, handleDeleteLead, } from "./tools/leads.js";
import { handleGetSequences, handleCreateSequenceStep, handleUpdateSequenceVariant, handleDeleteSequenceStep, } from "./tools/sequences.js";
import { handleListAccounts, handleGetAccount, handleUpdateWarmup, handleLinkAccountToCampaign, } from "./tools/accounts.js";
import { handleGetUniboxThreads, handleUpdateThread, } from "./tools/unibox.js";
import { handleGetAnalyticsOverview, handleGetCampaignAnalytics, } from "./tools/analytics.js";
import { handleListTemplates, handleCreateTemplate, handleDeleteTemplate, } from "./tools/templates.js";
import { resourcesList, readResource } from "./resources/index.js";
import { promptsList, getPromptMessages } from "./prompts/index.js";
export const tools = [
    // Campaign Tools
    {
        name: "instantly_list_campaigns",
        description: "List outreach campaigns with filters, progress stats, and tag associations",
        inputSchema: {
            type: "object",
            properties: {
                status: { type: "string", enum: ["draft", "active", "paused", "completed", "all"], description: "Filter by status" },
                search: { type: "string", description: "Search by campaign name" },
                limit: { type: "number", description: "Limit number of results (default 20)" },
                offset: { type: "number", description: "Pagination offset" },
            },
        },
    },
    {
        name: "instantly_get_campaign",
        description: "Retrieve comprehensive details for a specific campaign, including schedule, sequences, and attached accounts",
        inputSchema: {
            type: "object",
            properties: {
                campaignId: { type: "string", description: "The ID of the campaign" },
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
                startTime: { type: "string", description: "Sending window start time (e.g. '09:00')" },
                endTime: { type: "string", description: "Sending window end time (e.g. '17:00')" },
                timezone: { type: "string", description: "Timezone identifier (e.g. 'America/New_York', 'UTC')" },
                days: { type: "string", description: "Sending days (e.g. 'Mon,Tue,Wed,Thu,Fri')" },
                emailAccountIds: { type: "array", items: { type: "string" }, description: "IDs of email sender accounts to attach" },
            },
            required: ["name"],
        },
    },
    {
        name: "instantly_update_campaign_status",
        description: "Update the lifecycle status of a campaign (draft, active, paused, completed)",
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
    // Sequence & Step Tools
    {
        name: "instantly_get_sequences",
        description: "Get all sequence steps and A/B test variants for a campaign",
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
                dayGap: { type: "number", description: "Days to wait before sending this step (default 1)" },
                subject: { type: "string", description: "Email subject line (supports {{firstName}}, {{company}})" },
                body: { type: "string", description: "Email body copy" },
                variantLabel: { type: "string", description: "Label for the variant (e.g. 'Variant A')" },
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
                variantId: { type: "string", description: "Sequence variant ID" },
                subject: { type: "string", description: "New subject line" },
                body: { type: "string", description: "New body content" },
                weight: { type: "number", description: "A/B distribution weight (0-100)" },
                enabled: { type: "boolean", description: "Enable or disable variant" },
                label: { type: "string", description: "Variant label" },
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
        description: "List and search leads across campaigns with status and AI sentiment filtering",
        inputSchema: {
            type: "object",
            properties: {
                campaignId: { type: "string", description: "Filter by campaign ID" },
                status: { type: "string", enum: ["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead", "all"] },
                search: { type: "string", description: "Search by email, name, or company" },
                aiLabel: { type: "string", description: "Filter by AI label" },
                isStarred: { type: "boolean", description: "Filter starred leads" },
                isArchived: { type: "boolean", description: "Filter archived leads" },
                limit: { type: "number", description: "Limit (default 50)" },
                offset: { type: "number", description: "Offset" },
            },
        },
    },
    {
        name: "instantly_add_lead",
        description: "Add an individual lead into a campaign with custom personalization variables",
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
                customFields: { type: "object", description: "Dynamic custom variables" },
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
                            customFields: { type: "object" },
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
        description: "Update a lead's status, score, or Unibox metadata",
        inputSchema: {
            type: "object",
            properties: {
                leadId: { type: "string", description: "Lead ID" },
                status: { type: "string", enum: ["new", "contacted", "replied", "bounced", "unsubscribed", "sequence_complete", "lead"] },
                score: { type: "number", description: "Lead score (0-100)" },
                aiLabel: { type: "string", description: "AI label" },
                isStarred: { type: "boolean", description: "Star flag" },
                isArchived: { type: "boolean", description: "Archive flag" },
                isRead: { type: "boolean", description: "Read status" },
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
        description: "List email accounts with warmup status, reputation scores, and daily dispatch counts",
        inputSchema: {
            type: "object",
            properties: {
                status: { type: "string", enum: ["active", "paused", "error", "all"] },
                warmupEnabled: { type: "boolean", description: "Filter by warmup status" },
                limit: { type: "number", description: "Limit results" },
            },
        },
    },
    {
        name: "instantly_get_account",
        description: "Get detailed account settings, credentials provider, warmup history, and attached campaigns",
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
                enabled: { type: "boolean", description: "Enable/disable warmup" },
                dailyLimit: { type: "number", description: "Max warmup emails/day" },
                dailyIncrease: { type: "number", description: "Daily increase step" },
                replyRate: { type: "number", description: "Target reply rate (0-100)" },
                poolOptIn: { type: "boolean", description: "Opt into warmup pool" },
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
                campaignId: { type: "string", description: "Campaign ID" },
                accountId: { type: "string", description: "Email Account ID" },
                action: { type: "string", enum: ["link", "unlink"], description: "Action to perform" },
            },
            required: ["campaignId", "accountId", "action"],
        },
    },
    // Unibox Tools
    {
        name: "instantly_get_unibox_threads",
        description: "Fetch incoming email replies, conversations, and interaction history across all inboxes",
        inputSchema: {
            type: "object",
            properties: {
                status: { type: "string", enum: ["all", "unread", "starred", "archived"] },
                campaignId: { type: "string", description: "Filter by campaign" },
                aiLabel: { type: "string", description: "Filter by AI label" },
                search: { type: "string", description: "Search term" },
                limit: { type: "number", description: "Limit" },
                offset: { type: "number", description: "Offset" },
            },
        },
    },
    {
        name: "instantly_update_thread",
        description: "Update thread read state, star, archive, or AI categorization in Unibox",
        inputSchema: {
            type: "object",
            properties: {
                leadId: { type: "string", description: "Lead ID / Thread ID" },
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
        description: "Get workspace-level cold email metrics (total sent, opens, replies, CTR, bounces, and top campaigns)",
        inputSchema: {
            type: "object",
            properties: {
                startDate: { type: "string", description: "Optional start date filter (YYYY-MM-DD)" },
                endDate: { type: "string", description: "Optional end date filter (YYYY-MM-DD)" },
            },
        },
    },
    {
        name: "instantly_get_campaign_analytics",
        description: "Get campaign-specific performance summary and daily timeline data",
        inputSchema: {
            type: "object",
            properties: {
                campaignId: { type: "string", description: "Campaign ID" },
            },
            required: ["campaignId"],
        },
    },
    // Template Tools
    {
        name: "instantly_list_templates",
        description: "List reusable cold email templates and snippets",
        inputSchema: {
            type: "object",
            properties: {
                category: { type: "string", description: "Filter by template category" },
                search: { type: "string", description: "Search by title or content" },
            },
        },
    },
    {
        name: "instantly_create_template",
        description: "Create a new reusable email template with subject and body variables",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Template name" },
                subject: { type: "string", description: "Template subject line" },
                body: { type: "string", description: "Template body content" },
                category: { type: "string", description: "Template category" },
                isPublic: { type: "boolean", description: "Share with workspace members" },
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
                templateId: { type: "string", description: "Template ID" },
            },
            required: ["templateId"],
        },
    },
];
export function createMcpServer() {
    const server = new Server({
        name: "instantly-mcp-server",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
            resources: {},
            prompts: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args = {} } = request.params;
        try {
            let result;
            switch (name) {
                // Campaigns
                case "instantly_list_campaigns":
                    result = await handleListCampaigns(args);
                    break;
                case "instantly_get_campaign":
                    result = await handleGetCampaign(args);
                    break;
                case "instantly_create_campaign":
                    result = await handleCreateCampaign(args);
                    break;
                case "instantly_update_campaign_status":
                    result = await handleUpdateCampaignStatus(args);
                    break;
                case "instantly_delete_campaign":
                    result = await handleDeleteCampaign(args);
                    break;
                // Sequences
                case "instantly_get_sequences":
                    result = await handleGetSequences(args);
                    break;
                case "instantly_create_sequence_step":
                    result = await handleCreateSequenceStep(args);
                    break;
                case "instantly_update_sequence_variant":
                    result = await handleUpdateSequenceVariant(args);
                    break;
                case "instantly_delete_sequence_step":
                    result = await handleDeleteSequenceStep(args);
                    break;
                // Leads
                case "instantly_list_leads":
                    result = await handleListLeads(args);
                    break;
                case "instantly_add_lead":
                    result = await handleAddLead(args);
                    break;
                case "instantly_bulk_add_leads":
                    result = await handleBulkAddLeads(args);
                    break;
                case "instantly_update_lead":
                    result = await handleUpdateLead(args);
                    break;
                case "instantly_delete_lead":
                    result = await handleDeleteLead(args);
                    break;
                // Accounts & Warmup
                case "instantly_list_accounts":
                    result = await handleListAccounts(args);
                    break;
                case "instantly_get_account":
                    result = await handleGetAccount(args);
                    break;
                case "instantly_update_warmup":
                    result = await handleUpdateWarmup(args);
                    break;
                case "instantly_link_account_to_campaign":
                    result = await handleLinkAccountToCampaign(args);
                    break;
                // Unibox
                case "instantly_get_unibox_threads":
                    result = await handleGetUniboxThreads(args);
                    break;
                case "instantly_update_thread":
                    result = await handleUpdateThread(args);
                    break;
                // Analytics
                case "instantly_get_analytics_overview":
                    result = await handleGetAnalyticsOverview(args);
                    break;
                case "instantly_get_campaign_analytics":
                    result = await handleGetCampaignAnalytics(args);
                    break;
                // Templates
                case "instantly_list_templates":
                    result = await handleListTemplates(args);
                    break;
                case "instantly_create_template":
                    result = await handleCreateTemplate(args);
                    break;
                case "instantly_delete_template":
                    result = await handleDeleteTemplate(args);
                    break;
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error executing ${name}: ${error.message || String(error)}`,
                    },
                ],
            };
        }
    });
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return { resources: resourcesList };
    });
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        try {
            const resource = await readResource(uri);
            return {
                contents: [
                    {
                        uri: resource.uri,
                        mimeType: resource.mimeType,
                        text: resource.text,
                    },
                ],
            };
        }
        catch (error) {
            throw new McpError(ErrorCode.InvalidRequest, error.message || "Failed to read resource");
        }
    });
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        return { prompts: promptsList };
    });
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: args = {} } = request.params;
        try {
            const messages = getPromptMessages(name, args);
            return { messages };
        }
        catch (error) {
            throw new McpError(ErrorCode.InvalidRequest, error.message || "Failed to get prompt");
        }
    });
    return server;
}
//# sourceMappingURL=server.js.map