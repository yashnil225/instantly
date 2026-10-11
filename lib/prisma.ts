import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Resilient fetch wrapper for Turso / LibSQL HTTP client
 * Automatically catches and retries transient TCP socket disconnects:
 * - UND_ERR_SOCKET: 'other side closed' (idle connection closed by AWS/Turso ALB)
 * - ECONNRESET / fetch failed
 * Retries up to 3 times with exponential backoff on fresh sockets.
 */
const resilientFetch = async (input: any, init?: any) => {
    let retries = 3
    let delay = 100
    while (retries > 0) {
        try {
            return await fetch(input, init)
        } catch (err: any) {
            const isSocketClosed =
                err?.message?.includes('fetch failed') ||
                err?.cause?.code === 'UND_ERR_SOCKET' ||
                err?.cause?.message?.includes('other side closed') ||
                err?.code === 'ECONNRESET'

            retries--
            if (isSocketClosed && retries > 0) {
                console.warn(`[Turso LibSQL] Socket closed by server (${err?.cause?.code || err.message}). Retrying query in ${delay}ms...`)
                await new Promise(r => setTimeout(r, delay))
                delay *= 2
                continue
            }
            throw err
        }
    }
}

const createContext = () => {
    const isTursoEnabled = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN

    if (isTursoEnabled) {
        const libsql = createClient({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN!,
            fetch: resilientFetch,
        })
        const adapter = new PrismaLibSQL(libsql)
        return new PrismaClient({ adapter: adapter as any })
    }

    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma || createContext()

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}
