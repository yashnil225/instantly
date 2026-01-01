import { NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * public API v2: Clone Campaign
 * POST /api/v2/campaigns/[id]/clone
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const auth = await validateApiKey()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: (auth as any).status || 401 })
    const { user } = auth

    try {
        const campaign = await prisma.campaign.findFirst({
            where: { id, userId: user?.id },
            include: {
                sequences: {
                    include: {
                        variants: true
                    }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        // Clone logic
        const clonedCampaign = await prisma.campaign.create({
            data: {
                name: `${campaign.name} (Clone)`,
                userId: user?.id,
                status: 'draft',
                dailyLimit: campaign.dailyLimit,
                stopOnReply: campaign.stopOnReply,
                trackOpens: campaign.trackOpens,
                trackLinks: campaign.trackLinks,
                settings: campaign.settings,
                sequences: {
                    create: campaign.sequences.map(seq => ({
                        stepNumber: seq.stepNumber,
                        dayGap: seq.dayGap,
                        variants: {
                            create: seq.variants.map(variant => ({
                                subject: variant.subject,
                                body: variant.body,
                                weight: variant.weight
                            }))
                        }
                    }))
                }
            }
        })

        return NextResponse.json({ data: clonedCampaign })
    } catch (err) {
        console.error("API v2 Clone Error:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
