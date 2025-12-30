import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

interface RouteContext {
    params: Promise<{ id: string }>
}

/**
 * POST /api/v2/campaigns/[id]/followups
 * Add follow-up sequence steps to a campaign
 */
export async function POST(req: NextRequest, context: RouteContext) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { id } = await context.params

    try {
        // Verify ownership
        const campaign = await prisma.campaign.findFirst({
            where: { id, userId: auth.user.id },
            include: { sequences: { orderBy: { stepNumber: "desc" }, take: 1 } }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        const { steps } = await req.json()

        if (!steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: "steps array is required" }, { status: 400 })
        }

        const lastStepNumber = campaign.sequences[0]?.stepNumber || 0

        const createdSteps = await Promise.all(
            steps.map((step: { subject?: string; body: string; dayGap?: number }, index: number) =>
                prisma.sequence.create({
                    data: {
                        campaignId: id,
                        stepNumber: lastStepNumber + index + 1,
                        subject: step.subject || `Follow-up ${index + 1}`,
                        body: step.body,
                        dayGap: step.dayGap || 3
                    }
                })
            )
        )

        return NextResponse.json({
            message: `Added ${createdSteps.length} follow-up steps`,
            steps: createdSteps
        })
    } catch (error) {
        console.error("API POST /v2/campaigns/[id]/followups error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
