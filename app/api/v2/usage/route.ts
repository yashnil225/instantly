import { NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * public API v2: Usage Analytics
 * GET /api/v2/usage
 */
export async function GET() {
    const { user, error } = await validateApiKey()
    if (error) return NextResponse.json({ error }, { status: 401 })

    try {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Count emails sent this month across all campaigns belonging to this user
        const sentThisMonth = await prisma.sendingEvent.count({
            where: {
                type: 'sent',
                createdAt: { gte: firstDayOfMonth },
                campaign: {
                    userId: user?.id
                }
            }
        })

        // Count active campaigns
        const activeCampaigns = await prisma.campaign.count({
            where: {
                userId: user?.id,
                status: 'active'
            }
        })

        // Count connected accounts
        // Note: Currently accounts aren't strictly owned by users in the schema in a direct way 
        // through Workspace memberships, but based on Campaign ownership we can infer.
        // For simplicity, let's just return the sent count which is most important.

        return NextResponse.json({
            data: {
                emailsSentThisMonth: sentThisMonth,
                activeCampaigns: activeCampaigns,
                plan: user?.plan,
                billingCycleStart: firstDayOfMonth.toISOString()
            }
        })
    } catch (err) {
        console.error("API v2 Usage Error:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
