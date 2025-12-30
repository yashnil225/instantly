import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const accounts = await prisma.emailAccount.findMany({
            where: {
                userId: auth.user.id
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                provider: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json(accounts)
    } catch (error) {
        console.error("API GET /v2/accounts error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
