import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { classifyEmailStatus } from "@/lib/ai-service"

export async function POST(
    request: NextRequest,
    { params }: { params: { leadId: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { leadId } = params
        if (!leadId) {
            return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
        }

        // Fetch lead and latest events to get the last message
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                events: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        // Use the last event or lead info to classify
        const lastMessage = lead.events[0]?.details || ""
        const subject = "Email Reply" // Generic if not stored in events

        const suggestedLabel = await classifyEmailStatus(subject, lastMessage)

        // Update lead with suggested label
        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: {
                aiLabel: suggestedLabel,
                isRead: true // If we are analyzing, we likely read it or it's fresh
            }
        })

        return NextResponse.json({
            success: true,
            label: suggestedLabel,
            lead: updatedLead
        })

    } catch (error) {
        console.error("Failed to analyze lead:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
