import { NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { dispatchWebhook } from "@/lib/webhooks"

/**
 * public API v2: List Leads
 * GET /api/v2/leads
 */
export async function GET(req: Request) {
    const auth = await validateApiKey()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: (auth as any).status || 401 })
    const { user } = auth

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status')

    try {
        const where: any = {}
        if (campaignId) where.campaignId = campaignId
        if (status) where.status = status

        // Ensure user can only see leads for their campaigns
        where.campaign = {
            userId: user?.id
        }

        const leads = await prisma.lead.findMany({
            where,
            take: 100, // Limit for API safety
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ data: leads })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * public API v2: Add Single Lead
 * POST /api/v2/leads
 */
export async function POST(req: Request) {
    const auth = await validateApiKey()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: (auth as any).status || 401 })
    const { user } = auth

    try {
        const body = await req.json()
        const { email, campaignId, firstName, lastName, company } = body

        if (!email || !campaignId) {
            return NextResponse.json({ error: "Email and campaignId are required" }, { status: 400 })
        }

        // Verify campaign ownership
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, userId: user?.id }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found or unauthorized" }, { status: 404 })
        }

        const lead = await prisma.lead.create({
            data: {
                email,
                firstName,
                lastName,
                company,
                campaignId,
            }
        })

        // Dispatch Webhook
        if (user?.id) {
            dispatchWebhook(user.id, "lead.added", {
                lead: lead,
                campaignId: campaignId
            })
        }

        return NextResponse.json({ data: lead }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
