import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/v2/export
 * Export campaign/lead data as CSV
 */
export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type") || "leads" // leads, campaigns, analytics
    const campaignId = searchParams.get("campaignId")

    if (format !== "csv") {
        return NextResponse.json({ error: "Only CSV format is supported" }, { status: 400 })
    }

    try {
        let csvContent = ""

        if (type === "leads") {
            const leads = await prisma.lead.findMany({
                where: {
                    campaign: { userId: auth.user.id },
                    ...(campaignId && { campaignId })
                },
                include: {
                    campaign: { select: { name: true } }
                },
                take: 10000
            })

            // CSV Header
            csvContent = "Email,First Name,Last Name,Company,Status,Score,Campaign,Created At\n"

            // CSV Rows
            leads.forEach(lead => {
                csvContent += `"${lead.email}","${lead.firstName || ""}","${lead.lastName || ""}","${lead.company || ""}","${lead.status}","${lead.score}","${lead.campaign.name}","${lead.createdAt.toISOString()}"\n`
            })
        } else if (type === "campaigns") {
            const campaigns = await prisma.campaign.findMany({
                where: { userId: auth.user.id },
                include: {
                    _count: { select: { leads: true } }
                }
            })

            csvContent = "ID,Name,Status,Leads,Sent,Opened,Clicked,Replied,Bounced,Created At\n"

            campaigns.forEach(c => {
                csvContent += `"${c.id}","${c.name}","${c.status}","${c._count.leads}","${c.sentCount}","${c.openCount}","${c.clickCount}","${c.replyCount}","${c.bounceCount}","${c.createdAt.toISOString()}"\n`
            })
        } else {
            return NextResponse.json({ error: "Invalid type. Use 'leads' or 'campaigns'" }, { status: 400 })
        }

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${type}_export_${Date.now()}.csv"`
            }
        })
    } catch (error) {
        console.error("API GET /v2/export error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
