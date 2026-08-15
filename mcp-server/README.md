# Instantly Model Context Protocol (MCP) Server

A dedicated, fully-typed [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for the **Instantly Cold Outreach Tool**.

Allows AI assistants (Antigravity IDE, Claude Desktop, Cursor, etc.) to manage cold email campaigns, warmup health, leads, sequences, Unibox messages, templates, and analytics directly through conversational commands.

---

## ✨ Features & Capabilities

### 🛠️ 25 Specialized MCP Tools

| Category | Tools | Description |
| :--- | :--- | :--- |
| **Campaigns** | `instantly_list_campaigns`<br>`instantly_get_campaign`<br>`instantly_create_campaign`<br>`instantly_update_campaign_status`<br>`instantly_delete_campaign` | Manage cold outreach campaigns, schedules, sending windows, and status (draft, active, paused, completed). |
| **Sequences & Copy** | `instantly_get_sequences`<br>`instantly_create_sequence_step`<br>`instantly_update_sequence_variant`<br>`instantly_delete_sequence_step` | Create and customize multi-step email sequences, day gaps, and A/B test variants. |
| **Lead Management** | `instantly_list_leads`<br>`instantly_add_lead`<br>`instantly_bulk_add_leads`<br>`instantly_update_lead`<br>`instantly_delete_lead` | Filter leads by status and AI labels, import individual or bulk leads, adjust lead scores. |
| **Accounts & Warmup** | `instantly_list_accounts`<br>`instantly_get_account`<br>`instantly_update_warmup`<br>`instantly_link_account_to_campaign` | Monitor sender inbox deliverability, configure warmup ramp limits, attach sender accounts to campaigns. |
| **Unibox & Replies** | `instantly_get_unibox_threads`<br>`instantly_update_thread` | Review prospect replies, filter by AI categorization (`out_of_office`, `interested`), star/archive threads. |
| **Analytics & Stats** | `instantly_get_analytics_overview`<br>`instantly_get_campaign_analytics` | Workspace and campaign-level metrics: total sent, open rates, reply rates, click-through rates, and bounces. |
| **Templates** | `instantly_list_templates`<br>`instantly_create_template`<br>`instantly_delete_template` | Manage reusable outreach copy and follow-up templates with custom variables. |

---

### 📦 Dynamic Resources
- `instantly://campaigns`: Live JSON summary of all outreach campaigns.
- `instantly://accounts`: Sender accounts, warmup status, and health scores.
- `instantly://analytics/summary`: Workspace-wide aggregated outreach metrics.

---

### 💡 Reusable Prompts
- `instantly_draft_cold_email_sequence`: Expert cold email copywriter assistant tailored to ICP & offer.
- `instantly_analyze_campaign_performance`: Deliverability and reply rate diagnostic assistant.

---

## 🚀 Setup & Build

```bash
# Navigate to mcp-server directory
cd mcp-server

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run automated verification tests
npm test
```

---

## ⚙️ Client Configuration (`mcp_config.json`)

### Claude Desktop / Antigravity IDE / Cursor:

```json
{
  "mcpServers": {
    "instantly": {
      "command": "node",
      "args": [
        "c:/Users/yashn/Desktop/Workspace/instantly/mcp-server/dist/index.js"
      ],
      "env": {
        "DATABASE_URL": "file:c:/Users/yashn/Desktop/Workspace/instantly/prisma/dev.db"
      }
    }
  }
}
```
