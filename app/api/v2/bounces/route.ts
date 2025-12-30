import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/v2/bounces
 * Retrieve bounced leads for list hygiene
 */
export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId")

    try {
        const bounces = await prisma.lead.findMany({
            where: {
                status: "bounced",
                campaign: {
                    userId: auth.user.id,
                    ...(campaignId && { id: campaignId })
                }
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                campaignId: true,
                updatedAt: true
            },
            orderBy: { updatedAt: "desc" },
            take: 500
        })

        return NextResponse.json({
            data: bounces,
            count: bounces.length
        })
    } catch (error) {
        console.error("API GET /v2/bounces error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * POST /api/v2/bounces/cleanup
 * Remove bounced leads from specified campaigns
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { campaignId } = await req.json()

        const result = await prisma.lead.deleteMany({
            where: {
                status: "bounced",
                campaign: {
                    userId: auth.user.id,
                    ...(campaignId && { id: campaignId })
                }
            }
        })

        return NextResponse.json({
            message: `Removed ${result.count} bounced leads`,
            deletedCount: result.count
        })
    } catch (error) {
        console.error("API POST /v2/bounces/cleanup error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
