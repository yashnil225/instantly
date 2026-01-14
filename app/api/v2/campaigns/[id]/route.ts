import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(
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
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                userId: auth.user.id
            },
            include: {
                _count: {
                    select: { leads: true }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        return NextResponse.json(campaign)
    } catch (error) {
        console.error("API GET /v2/campaigns/[id] error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(
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
        const body = await req.json()
        const { name, status, startTime, endTime, timezone, days } = body

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
            data: {
                ...(name && { name }),
                ...(status && { status }),
                ...(startTime && { startTime }),
                ...(endTime && { endTime }),
                ...(timezone && { timezone }),
                ...(days && { days })
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("API PATCH /v2/campaigns/[id] error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
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

        await prisma.campaign.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("API DELETE /v2/campaigns/[id] error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
