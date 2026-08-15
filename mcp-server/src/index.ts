#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { ensureDbConnection } from "./db.js"
import { createMcpServer } from "./server.js"

async function main() {
  await ensureDbConnection()
  const server = createMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Instantly MCP Server running on stdio")
}

main().catch((error) => {
  console.error("Fatal error starting Instantly MCP Server:", error)
  process.exit(1)
})
