import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/v2/analytics/clicks
 * Get click tracking data for campaigns
 */
export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId")

    try {
        const events = await prisma.sendingEvent.findMany({
            where: {
                type: "clicked",
                lead: {
                    campaign: {
                        userId: auth.user.id,
                        ...(campaignId && { id: campaignId })
                    }
                }
            },
            include: {
                lead: {
                    select: {
                        email: true,
                        firstName: true,
                        campaignId: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 500
        })

        return NextResponse.json({
            data: events.map(e => ({
                id: e.id,
                leadEmail: e.lead.email,
                leadName: e.lead.firstName,
                campaignId: e.lead.campaignId,
                clickedAt: e.createdAt,
                metadata: e.metadata ? JSON.parse(e.metadata) : null
            })),
            count: events.length
        })
    } catch (error) {
        console.error("API GET /v2/analytics/clicks error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
