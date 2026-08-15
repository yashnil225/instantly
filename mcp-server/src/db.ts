import { PrismaClient } from "@prisma/client"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root if present
dotenv.config({ path: path.resolve(__dirname, "../../.env") })
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })

const defaultDbPath = path.resolve(__dirname, "../../prisma/dev.db")
const databaseUrl = process.env.DATABASE_URL || `file:${defaultDbPath.replace(/\\/g, "/")}`

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

export async function ensureDbConnection() {
  try {
    await prisma.$connect()
    return true
  } catch (error) {
    console.error("Failed to connect to Prisma database:", error)
    return false
  }
}
