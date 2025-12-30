import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/v2/leads/bulk-status
 * Update status for multiple leads at once
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { leadIds, status } = await req.json()

        if (!leadIds || !Array.isArray(leadIds) || !status) {
            return NextResponse.json({ error: "leadIds (array) and status are required" }, { status: 400 })
        }

        // Verify ownership of all leads
        const leads = await prisma.lead.findMany({
            where: {
                id: { in: leadIds },
                campaign: { userId: auth.user.id }
            },
            select: { id: true }
        })

        const ownedLeadIds = leads.map(l => l.id)

        if (ownedLeadIds.length === 0) {
            return NextResponse.json({ error: "No authorized leads found" }, { status: 404 })
        }

        const result = await prisma.lead.updateMany({
            where: { id: { in: ownedLeadIds } },
            data: { status }
        })

        return NextResponse.json({
            message: `Updated ${result.count} leads`,
            updatedCount: result.count
        })
    } catch (error) {
        console.error("API POST /v2/leads/bulk-status error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
