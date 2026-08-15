import express from "express"
import cors from "cors"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { ensureDbConnection } from "./db.js"
import { createMcpServer, tools } from "./server.js"

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: "*" }))

// Active transports keyed by sessionId
const transports = new Map<string, SSEServerTransport>()

// Root status & discovery info
app.get(["/", "/health"], (req, res) => {
  res.json({
    status: "healthy",
    name: "instantly-mcp-server",
    version: "1.0.0",
    protocol: "mcp",
    sseEndpoint: "/sse",
    mcpEndpoint: "/mcp",
    toolsCount: tools.length,
    description: "Instantly Cold Email Outreach MCP Server for Gemini Spark, Claude, and AI Assistants",
  })
})

// SSE Handlers (/sse and /mcp)
const handleSse = async (req: express.Request, res: express.Response) => {
  console.log(`[MCP-SSE] New SSE client connected from ${req.ip || "unknown"}`)
  const transport = new SSEServerTransport("/messages", res)
  const server = createMcpServer()
  
  transports.set(transport.sessionId, transport)

  transport.onclose = () => {
    console.log(`[MCP-SSE] Session closed: ${transport.sessionId}`)
    transports.delete(transport.sessionId)
  }

  await server.connect(transport)
}

app.get("/sse", handleSse)
app.get("/mcp", handleSse)

// Message Handlers (/messages and /mcp/messages)
const handleMessage = async (req: express.Request, res: express.Response) => {
  const sessionId = (req.query.sessionId as string) || (req.headers["x-session-id"] as string)
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId query parameter" })
    return
  }

  const transport = transports.get(sessionId)
  if (!transport) {
    res.status(404).json({ error: `Session not found or expired: ${sessionId}` })
    return
  }

  await transport.handlePostMessage(req, res)
}

app.post("/messages", handleMessage)
app.post("/mcp/messages", handleMessage)

async function start() {
  await ensureDbConnection()
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`==================================================`)
    console.log(`🚀 Instantly HTTP/SSE MCP Server running on port ${PORT}`)
    console.log(`📡 SSE Endpoint: http://localhost:${PORT}/sse`)
    console.log(`📡 Alternate Endpoint: http://localhost:${PORT}/mcp`)
    console.log(`✨ Ready for Gemini Spark, Claude, and remote clients!`)
    console.log(`==================================================`)
  })
}

start().catch((err) => {
  console.error("Fatal error starting HTTP MCP Server:", err)
  process.exit(1)
})
