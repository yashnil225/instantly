import { NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * public API v2: List Campaigns
 * GET /api/v2/campaigns
 */
export async function GET() {
    const auth = await validateApiKey()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: (auth as any).status || 401 })
    const { user } = auth

    try {
        const campaigns = await prisma.campaign.findMany({
            where: {
                userId: user?.id
            },
            include: {
                _count: {
                    select: { leads: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            data: campaigns.map(c => ({
                id: c.id,
                name: c.name,
                status: c.status,
                stats: {
                    sent: c.sentCount,
                    opened: c.openCount,
                    clicked: c.clickCount,
                    replied: c.replyCount,
                    bounced: c.bounceCount
                },
                leadCount: c._count.leads,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt
            }))
        })
    } catch (err) {
        console.error("API v2 Campaigns Error:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * public API v2: Create Campaign
 * POST /api/v2/campaigns
 */
export async function POST(req: Request) {
    const { user, error } = await validateApiKey()

    if (error) {
        return NextResponse.json({ error }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: "Campaign name is required" }, { status: 400 })
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                userId: user?.id,
                status: 'draft'
            }
        })

        return NextResponse.json({ data: campaign }, { status: 201 })
    } catch (err) {
        console.error("API v2 Campaigns Create Error:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
