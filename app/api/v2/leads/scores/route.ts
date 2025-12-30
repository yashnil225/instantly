import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/v2/leads/scores
 * Retrieve leads sorted by engagement score
 */
export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId")
    const minScore = parseInt(searchParams.get("minScore") || "0")

    try {
        const leads = await prisma.lead.findMany({
            where: {
                campaign: { userId: auth.user.id },
                ...(campaignId && { campaignId }),
                score: { gte: minScore }
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                status: true,
                score: true,
                campaignId: true
            },
            orderBy: { score: "desc" },
            take: 100
        })

        return NextResponse.json({ data: leads })
    } catch (error) {
        console.error("API GET /v2/leads/scores error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
