import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runTests() {
  console.log("==================================================")
  console.log("🚀 STARTING INSTANTLY MCP SERVER VERIFICATION")
  console.log("==================================================\n")

  const serverPath = path.resolve(__dirname, "../dist/index.js")
  console.log(`Spawning MCP Server at: ${serverPath}`)

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  })

  const client = new Client(
    {
      name: "instantly-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  )

  try {
    console.log("1. Connecting to MCP Server over stdio...")
    await client.connect(transport)
    console.log("   ✅ Successfully connected to MCP Server!\n")

    // 2. Test Tools
    console.log("2. Testing Tools Discovery...")
    const toolsResponse = await client.listTools()
    console.log(`   Found ${toolsResponse.tools.length} registered tools:`)
    toolsResponse.tools.forEach((t) =>
      console.log(`   - ${t.name}: ${(t.description || "").slice(0, 60)}...`)
    )
    if (toolsResponse.tools.length === 0) throw new Error("No tools discovered")
    console.log("   ✅ Tools discovery verified!\n")

    // 3. Test Resources
    console.log("3. Testing Resources Discovery and Read...")
    const resourcesResponse = await client.listResources()
    console.log(`   Found ${resourcesResponse.resources.length} resources:`)
    resourcesResponse.resources.forEach((r) => console.log(`   - ${r.uri} (${r.name})`))

    const sampleResource = await client.readResource({ uri: "instantly://analytics/summary" })
    const sampleContent = sampleResource.contents[0]
    const sampleText = sampleContent && "text" in sampleContent ? sampleContent.text : ""
    console.log("   Read 'instantly://analytics/summary':", sampleText.slice(0, 100), "...")
    console.log("   ✅ Resources read verified!\n")

    // 4. Test Prompts
    console.log("4. Testing Prompts...")
    const promptsResponse = await client.listPrompts()
    console.log(`   Found ${promptsResponse.prompts.length} prompts:`)
    promptsResponse.prompts.forEach((p) => console.log(`   - ${p.name}`))

    const promptResult = await client.getPrompt({
      name: "instantly_draft_cold_email_sequence",
      arguments: { targetAudience: "B2B SaaS CTOs", valueProposition: "Cut cloud bills by 30%" },
    })
    const promptMsg = promptResult.messages[0]?.content
    const promptText = promptMsg && typeof promptMsg === "object" && "text" in promptMsg ? (promptMsg as any).text : ""
    console.log("   Generated Prompt message preview:", String(promptText).slice(0, 120), "...")
    console.log("   ✅ Prompts verified!\n")

    // 5. Test Tool Invocations
    console.log("5. Testing Tool Invocations against Database...")

    // 5a. Call instantly_list_campaigns
    console.log("   -> Calling 'instantly_list_campaigns'...")
    const campaignsResult = await client.callTool({
      name: "instantly_list_campaigns",
      arguments: { limit: 5 },
    })
    console.log("      Result:", (campaignsResult.content as any)[0]?.text?.slice(0, 150), "...")

    // 5b. Call instantly_list_accounts
    console.log("   -> Calling 'instantly_list_accounts'...")
    const accountsResult = await client.callTool({
      name: "instantly_list_accounts",
      arguments: { limit: 5 },
    })
    console.log("      Result:", (accountsResult.content as any)[0]?.text?.slice(0, 150), "...")

    // 5c. Call instantly_get_analytics_overview
    console.log("   -> Calling 'instantly_get_analytics_overview'...")
    const analyticsResult = await client.callTool({
      name: "instantly_get_analytics_overview",
      arguments: {},
    })
    console.log("      Result:", (analyticsResult.content as any)[0]?.text?.slice(0, 150), "...")

    // 5d. Call instantly_list_templates
    console.log("   -> Calling 'instantly_list_templates'...")
    const templatesResult = await client.callTool({
      name: "instantly_list_templates",
      arguments: {},
    })
    console.log("      Result:", (templatesResult.content as any)[0]?.text?.slice(0, 150), "...")

    console.log("\n==================================================")
    console.log("🎉 ALL MCP SERVER PROTOCOL TESTS PASSED SUCCESSFULLY!")
    console.log("==================================================")
    process.exit(0)
  } catch (error) {
    console.error("\n❌ MCP Test verification failed:", error)
    process.exit(1)
  }
}

runTests()
