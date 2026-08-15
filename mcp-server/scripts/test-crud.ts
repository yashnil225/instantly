import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runCrudTest() {
  console.log("==================================================")
  console.log("🧪 TESTING FULL MCP END-TO-END CRUD FLOW")
  console.log("==================================================\n")

  const serverPath = path.resolve(__dirname, "../dist/index.js")
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  })

  const client = new Client(
    {
      name: "instantly-crud-test-client",
      version: "1.0.0",
    },
    { capabilities: {} }
  )

  await client.connect(transport)

  // 1. Create a campaign via MCP
  console.log("1. Creating Campaign via 'instantly_create_campaign'...")
  const createCampaignRes = await client.callTool({
    name: "instantly_create_campaign",
    arguments: {
      name: "Q3 Outbound Outreach Test",
      dailyLimit: 75,
      stopOnReply: true,
      trackOpens: true,
      trackLinks: true,
      startTime: "09:00",
      endTime: "17:00",
      timezone: "America/New_York",
      days: "Mon,Tue,Wed,Thu,Fri",
    },
  })
  const campaignData = JSON.parse((createCampaignRes.content as any)[0].text)
  console.log("   Created Campaign ID:", campaignData.campaignId)

  // 2. Add sequence step via MCP
  console.log("2. Adding Sequence Step via 'instantly_create_sequence_step'...")
  const createStepRes = await client.callTool({
    name: "instantly_create_sequence_step",
    arguments: {
      campaignId: campaignData.campaignId,
      dayGap: 0,
      subject: "Quick question regarding {{company}}'s cold email",
      body: "Hi {{firstName}},\n\nSaw your work at {{company}}. Would love to share a quick 2-min idea on scaling outbound.\n\nBest,\nTeam",
      variantLabel: "Variant A (Direct)",
    },
  })
  const stepData = JSON.parse((createStepRes.content as any)[0].text)
  console.log("   Created Sequence Step ID:", stepData.sequenceId)

  // 3. Add Lead via MCP
  console.log("3. Adding Lead via 'instantly_add_lead'...")
  const addLeadRes = await client.callTool({
    name: "instantly_add_lead",
    arguments: {
      campaignId: campaignData.campaignId,
      email: "alex.growth@example.com",
      firstName: "Alex",
      lastName: "Rivera",
      company: "Acme SaaS",
      customFields: { industry: "Technology", teamSize: 25 },
    },
  })
  const leadData = JSON.parse((addLeadRes.content as any)[0].text)
  console.log("   Created Lead ID:", leadData.leadId)

  // 4. Create Template via MCP
  console.log("4. Creating Template via 'instantly_create_template'...")
  const createTplRes = await client.callTool({
    name: "instantly_create_template",
    arguments: {
      name: "SaaS Founder Intro",
      category: "Outreach",
      subject: "Scaling {{company}} in Q3",
      body: "Hi {{firstName}}, wondering how you are approaching pipeline this quarter?",
      isPublic: true,
    },
  })
  const tplData = JSON.parse((createTplRes.content as any)[0].text)
  console.log("   Created Template ID:", tplData.templateId)

  // 5. Query back via MCP
  console.log("5. Querying back Campaign details via 'instantly_get_campaign'...")
  const getCampRes = await client.callTool({
    name: "instantly_get_campaign",
    arguments: { campaignId: campaignData.campaignId },
  })
  const retrievedCampaign = JSON.parse((getCampRes.content as any)[0].text)
  console.log("   Retrieved Campaign Name:", retrievedCampaign.campaign.name)
  console.log("   Sequence steps count:", retrievedCampaign.campaign.sequences.length)

  // 6. Update Campaign Status to active
  console.log("6. Updating Campaign Status to 'active'...")
  const updateStatusRes = await client.callTool({
    name: "instantly_update_campaign_status",
    arguments: { campaignId: campaignData.campaignId, status: "active" },
  })
  console.log("   Updated Status:", JSON.parse((updateStatusRes.content as any)[0].text).status)

  // 7. Verify List Leads
  console.log("7. Querying Leads via 'instantly_list_leads'...")
  const listLeadsRes = await client.callTool({
    name: "instantly_list_leads",
    arguments: { campaignId: campaignData.campaignId },
  })
  const retrievedLeads = JSON.parse((listLeadsRes.content as any)[0].text)
  console.log("   Found Leads in campaign:", retrievedLeads.count)

  console.log("\n==================================================")
  console.log("✅ ALL CRUD OPERATIONS THROUGH MCP EXECUTED FLAWLESSLY!")
  console.log("==================================================")
  process.exit(0)
}

runCrudTest().catch((err) => {
  console.error("CRUD test failed:", err)
  process.exit(1)
})
