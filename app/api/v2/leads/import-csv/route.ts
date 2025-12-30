import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/v2/leads/import-csv
 * Bulk import leads from CSV data
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { campaignId, leads } = await req.json()

        if (!campaignId) {
            return NextResponse.json({ error: "campaignId is required" }, { status: 400 })
        }

        if (!leads || !Array.isArray(leads) || leads.length === 0) {
            return NextResponse.json({ error: "leads array is required" }, { status: 400 })
        }

        // Verify campaign ownership
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, userId: auth.user.id }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        // Limit batch size
        const maxBatch = 1000
        const leadsToImport = leads.slice(0, maxBatch)

        // Deduplicate by email within the batch
        const seen = new Set<string>()
        const uniqueLeads = leadsToImport.filter((lead: any) => {
            const email = lead.email?.toLowerCase()
            if (!email || seen.has(email)) return false
            seen.add(email)
            return true
        })

        // Check for existing emails in this campaign
        const existingEmails = await prisma.lead.findMany({
            where: {
                campaignId,
                email: { in: Array.from(seen) }
            },
            select: { email: true }
        })
        const existingSet = new Set(existingEmails.map(l => l.email.toLowerCase()))

        const newLeads = uniqueLeads.filter((l: any) => !existingSet.has(l.email.toLowerCase()))

        // Create leads
        const created = await prisma.lead.createMany({
            data: newLeads.map((lead: any) => ({
                email: lead.email,
                firstName: lead.firstName || lead.first_name || null,
                lastName: lead.lastName || lead.last_name || null,
                company: lead.company || null,
                customFields: lead.customFields ? JSON.stringify(lead.customFields) : null,
                campaignId
            }))
        })

        return NextResponse.json({
            message: `Imported ${created.count} leads`,
            imported: created.count,
            skipped: uniqueLeads.length - created.count,
            duplicatesInBatch: leadsToImport.length - uniqueLeads.length,
            truncated: leads.length > maxBatch
        }, { status: 201 })
    } catch (error) {
        console.error("API POST /v2/leads/import-csv error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
