import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let prismaInstance: PrismaClient

// Check if we should use Turso adapter
const isTursoEnabled = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN

if (isTursoEnabled) {
    // Only import and use Turso if both env vars are present
    const { PrismaLibSQL } = require("@prisma/adapter-libsql")
    const { createClient } = require("@libsql/client")
    
    try {
        const libsql = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        })
        const adapter = new PrismaLibSQL(libsql)
        prismaInstance = new PrismaClient({ adapter: adapter as any })
    } catch (error) {
        console.warn("Failed to initialize Turso adapter, falling back to default PrismaClient", error)
        prismaInstance = new PrismaClient()
    }
} else {
    prismaInstance = new PrismaClient()
}

export const prisma = globalForPrisma.prisma || prismaInstance

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}
