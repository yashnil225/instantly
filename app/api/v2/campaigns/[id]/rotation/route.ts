import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

interface RouteContext {
    params: Promise<{ id: string }>
}

/**
 * POST /api/v2/campaigns/[id]/rotation
 * Configure inbox rotation for a campaign
 */
export async function POST(req: NextRequest, context: RouteContext) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { id } = await context.params

    try {
        // Verify campaign ownership
        const campaign = await prisma.campaign.findFirst({
            where: { id, userId: auth.user.id }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        const { accountIds } = await req.json()

        if (!accountIds || !Array.isArray(accountIds)) {
            return NextResponse.json({ error: "accountIds array is required" }, { status: 400 })
        }

        // Verify user owns all accounts
        const accounts = await prisma.emailAccount.findMany({
            where: {
                id: { in: accountIds },
                userId: auth.user.id
            }
        })

        if (accounts.length !== accountIds.length) {
            return NextResponse.json({ error: "Some accounts not found or unauthorized" }, { status: 400 })
        }

        // Clear existing associations
        await prisma.campaignEmailAccount.deleteMany({
            where: { campaignId: id }
        })

        // Create new associations
        await prisma.campaignEmailAccount.createMany({
            data: accountIds.map((accountId: string) => ({
                campaignId: id,
                emailAccountId: accountId
            }))
        })

        return NextResponse.json({
            message: `Configured ${accounts.length} accounts for inbox rotation`,
            accounts: accounts.map(a => ({
                id: a.id,
                email: a.email
            }))
        })
    } catch (error) {
        console.error("API POST /v2/campaigns/[id]/rotation error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * GET /api/v2/campaigns/[id]/rotation
 * Get current inbox rotation config
 */
export async function GET(req: NextRequest, context: RouteContext) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { id } = await context.params

    try {
        const campaign = await prisma.campaign.findFirst({
            where: { id, userId: auth.user.id },
            include: {
                campaignAccounts: {
                    include: {
                        emailAccount: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                status: true
                            }
                        }
                    }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        return NextResponse.json({
            campaignId: id,
            accounts: (campaign as any).campaignAccounts.map((ea: any) => ea.emailAccount)
        })
    } catch (error) {
        console.error("API GET /v2/campaigns/[id]/rotation error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
