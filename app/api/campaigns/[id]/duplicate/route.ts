import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const newName = body.name
        if (!newName) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        console.log(`[DUPLICATE] Starting duplication for ${campaignId} -> ${newName}`)

        // Fetch original campaign with relations
        const original = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                sequences: {
                    include: {
                        variants: true
                    }
                },
                campaignAccounts: true,
                campaignWorkspaces: true
            }
        })

        if (!original) {
            return NextResponse.json({ error: 'Source campaign not found' }, { status: 404 })
        }

        console.log(`[DUPLICATE] Found original with ${original.sequences.length} sequences`)

        // Create new campaign
        const newCampaign = await prisma.campaign.create({
            data: {
                name: newName,
                userId: session.user.id || original.userId,
                status: 'draft',

                // Copy settings
                scheduleName: original.scheduleName,
                startTime: original.startTime,
                endTime: original.endTime,
                timezone: original.timezone,
                days: original.days,
                startDate: original.startDate,
                endDate: original.endDate,
                dailyLimit: original.dailyLimit,
                stopOnReply: original.stopOnReply,
                trackLinks: original.trackLinks,
                trackOpens: original.trackOpens,
                settings: original.settings,
                lastAccountIndex: 0,

                // Duplicate Sequences
                sequences: {
                    create: original.sequences.map(seq => ({
                        stepNumber: seq.stepNumber,
                        dayGap: seq.dayGap,
                        subject: seq.subject || "",
                        body: seq.body || "",
                        variants: {
                            create: (seq.variants || []).map(v => ({
                                subject: v.subject || "",
                                body: v.body || "",
                                weight: v.weight ?? 50
                            }))
                        }
                    }))
                },

                // Duplicate Workspace Links
                campaignWorkspaces: {
                    create: (original.campaignWorkspaces || []).map(cw => ({
                        workspaceId: cw.workspaceId
                    }))
                },

                // Duplicate Account Links
                campaignAccounts: {
                    create: (original.campaignAccounts || []).map(ca => ({
                        emailAccountId: ca.emailAccountId
                    }))
                }
            }
        })

        console.log(`[DUPLICATE] Success: ${newCampaign.id}`)
        return NextResponse.json(newCampaign)

    } catch (error) {
        console.error("[DUPLICATE ERROR]:", error)
        let message = 'Failed to duplicate campaign'
        if (error instanceof Error) message = error.message

        return NextResponse.json({
            error: message.substring(0, 500) // Truncate to keep toast clean
        }, { status: 500 })
    }
}
