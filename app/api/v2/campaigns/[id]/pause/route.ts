import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { dispatchWebhook } from "@/lib/webhooks"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        // id already awaited

        // Verify ownership
        const existing = await prisma.campaign.findFirst({
            where: {
                id,
                userId: auth.user.id
            }
        })

        if (!existing) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        const updated = await prisma.campaign.update({
            where: { id },
            data: { status: 'paused' }
        })

        // Dispatch Webhook
        if (auth.user.id) {
            dispatchWebhook(auth.user.id, "campaign.paused", {
                campaignId: updated.id,
                name: updated.name,
                status: updated.status
            })
        }

        return NextResponse.json({ success: true, status: updated.status })
    } catch (error) {
        console.error("API POST /v2/campaigns/[id]/pause error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
