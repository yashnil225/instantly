import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { spawn, ChildProcess } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runSseTest() {
  console.log("==================================================")
  console.log("🌐 TESTING MCP SERVER OVER HTTP / SSE")
  console.log("==================================================\n")

  const serverPath = path.resolve(__dirname, "../dist/http.js")
  const serverProc: ChildProcess = spawn("node", [serverPath], {
    stdio: "inherit",
  })

  // Wait 2.5s for server to start listening on port 3001
  await new Promise((resolve) => setTimeout(resolve, 2500))

  try {
    const sseUrl = new URL("http://localhost:3001/sse")
    console.log(`Connecting to SSE stream at ${sseUrl.toString()}...`)

    const transport = new SSEClientTransport(sseUrl)
    const client = new Client(
      {
        name: "instantly-sse-tester",
        version: "1.0.0",
      },
      { capabilities: {} }
    )

    await client.connect(transport)
    console.log("✅ Successfully connected over HTTP / SSE transport!\n")

    // Test tool list
    const tools = await client.listTools()
    console.log(`Discovered ${tools.tools.length} tools over SSE`)

    // Test calling a tool over SSE
    const res = await client.callTool({
      name: "instantly_get_analytics_overview",
      arguments: {},
    })
    console.log("Tool execution over SSE succeeded:")
    console.log((res.content as any)[0].text)

    console.log("\n==================================================")
    console.log("🎉 HTTP/SSE MCP VERIFICATION PASSED 100%!")
    console.log("==================================================")

    serverProc.kill()
    process.exit(0)
  } catch (error) {
    console.error("SSE Test failed:", error)
    serverProc.kill()
    process.exit(1)
  }
}

runSseTest()
