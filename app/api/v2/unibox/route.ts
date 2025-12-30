import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || "replied"
    const isRead = searchParams.get("isRead") === "true" ? true : searchParams.get("isRead") === "false" ? false : undefined
    const campaignId = searchParams.get("campaignId")

    try {
        const leads = await prisma.lead.findMany({
            where: {
                campaign: {
                    userId: auth.user.id
                },
                AND: [
                    status ? { status } : {},
                    isRead !== undefined ? { isRead } : {},
                    campaignId ? { campaignId } : {}
                ]
            },
            include: {
                campaign: {
                    select: {
                        name: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            },
            orderBy: { updatedAt: "desc" },
            take: 50
        })

        return NextResponse.json(leads)
    } catch (error) {
        console.error("API GET /v2/unibox error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
