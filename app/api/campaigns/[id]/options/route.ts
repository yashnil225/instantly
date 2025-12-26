import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                campaignAccounts: {
                    include: {
                        emailAccount: true
                    }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        // Parse settings JSON if it exists
        let settings = {}
        if (campaign.settings) {
            try {
                settings = JSON.parse(campaign.settings)
            } catch (e) {
                console.error("Failed to parse settings JSON", e)
            }
        }

        return NextResponse.json({
            ...campaign,
            ...settings
        })
    } catch (error) {
        console.error("Failed to fetch campaign options:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const {
            // Main settings (Direct columns)
            accountIds,
            stopOnReply,
            trackLinks,
            trackOpens,
            dailyLimit,

            // Advanced settings (To be stored in JSON)
            sendAsTextOnly,
            sendFirstAsText,
            owner,
            tags,
            minTimeGap,
            randomTimeGap,
            maxNewLeads,
            prioritizeNewLeads,
            autoOptimizeAZ,
            winningMetric,
            providerMatching,
            stopOnCompanyReply,
            stopOnAutoReply,
            insertUnsubscribeHeader,
            enableRiskyEmails,
            disableBounceProtect,
            ccRecipients,
            bccRecipients,
            overrideDeliverability
        } = body

        // Prepare JSON settings object
        const settings = JSON.stringify({
            sendAsTextOnly,
            sendFirstAsText,
            owner,
            tags,
            minTimeGap,
            randomTimeGap,
            maxNewLeads,
            prioritizeNewLeads,
            autoOptimizeAZ,
            winningMetric,
            providerMatching,
            stopOnCompanyReply,
            stopOnAutoReply,
            insertUnsubscribeHeader,
            enableRiskyEmails,
            disableBounceProtect,
            ccRecipients,
            bccRecipients,
            overrideDeliverability
        })

        // Update campaign
        const updatedCampaign = await prisma.campaign.update({
            where: { id },
            data: {
                stopOnReply: stopOnReply ?? undefined,
                trackLinks: trackLinks ?? undefined,
                trackOpens: trackOpens ?? undefined,
                dailyLimit: dailyLimit ? parseInt(dailyLimit) : null,
                settings
            }
        })

        // Update campaign accounts if provided
        if (accountIds && Array.isArray(accountIds)) {
            // Delete existing associations
            await prisma.campaignEmailAccount.deleteMany({
                where: { campaignId: id }
            })

            // Create new associations
            if (accountIds.length > 0) {
                await prisma.campaignEmailAccount.createMany({
                    data: accountIds.map((accountId: string) => ({
                        campaignId: id,
                        emailAccountId: accountId
                    }))
                })
            }
        }

        return NextResponse.json({
            success: true,
            campaign: updatedCampaign
        })
    } catch (error) {
        console.error("Failed to update campaign options:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
