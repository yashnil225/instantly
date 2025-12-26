import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { determineSimilarity } from "@/lib/ai-service"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const leadId = searchParams.get("leadId")

        if (!leadId) {
            return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
        }

        const targetLead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                campaign: true,
                events: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        })

        if (!targetLead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        const targetContent = targetLead.events[0]?.details || targetLead.email

        // Broad initial filter
        const candidates = await prisma.lead.findMany({
            where: {
                id: { not: leadId },
                OR: [
                    { company: targetLead.company },
                    { campaignId: targetLead.campaignId },
                    { aiLabel: targetLead.aiLabel }
                ]
            },
            take: 20,
            include: {
                campaign: { select: { id: true, name: true } },
                events: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        })

        // Semantic Ranking via AI
        const rankedLeads = await Promise.all(candidates.map(async (lead: any) => {
            const candidateContent = lead.events[0]?.details || lead.email
            const similarity = await determineSimilarity(targetContent, candidateContent)
            return { ...lead, similarity }
        }))

        // Sort by similarity and take top 10
        const topLeads = rankedLeads
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10)

        // Transform to email format for Unibox
        const emails = topLeads.map((lead: any) => ({
            id: lead.id,
            from: lead.email,
            fromName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email,
            company: lead.company,
            subject: "Similar Lead Match",
            preview: `Intent Match: ${lead.similarity}% | ${lead.aiLabel || 'Unknown'}`,
            timestamp: lead.updatedAt,
            isRead: lead.isRead,
            status: lead.status,
            aiLabel: lead.aiLabel,
            campaign: lead.campaign,
            hasReply: false,
            recipient: session?.user?.name || 'You',
        }))

        return NextResponse.json(emails)

    } catch (error) {
        console.error("Failed to find similar leads:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
