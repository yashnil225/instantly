import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const id = await params.id
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
    { params }: { params: { id: string } }
) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const id = await params.id
        const body = await req.json()
        const { name, status } = body

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
                ...(status && { status })
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
    { params }: { params: { id: string } }
) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const id = await params.id

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
