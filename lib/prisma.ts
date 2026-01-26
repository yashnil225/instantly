import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const createContext = () => {
    const isTursoEnabled = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN

    if (isTursoEnabled) {
        const libsql = createClient({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN!,
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
