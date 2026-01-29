import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { aiLabel, isRead, isStarred, isArchived } = body

        // We need to update the Lead associated with this email thread (SendingEvent)
        // Or if we are tracking state on SendingEvent/UniboxEmail model.
        // Based on previous analysis, Unibox state seems to be on the Lead model (aiLabel, isRead, etc.)
        // But the ID passed here might be the SendingEvent ID or the Lead ID.
        // Let's assume the ID passed is the Email (SendingEvent) ID for now, but usually Unibox groups by Lead.

        // Let's check if the ID corresponds to a Lead or SendingEvent.
        // In unibox/page.tsx, the emails are mapped from SendingEvents, but their ID is event.id.
        // However, the state (isRead, aiLabel) is on the LEAD.

        // We need to find the lead associated with this event ID first.
        const event = await prisma.sendingEvent.findUnique({
            where: { id },
            select: { leadId: true }
        })

        if (!event) {
            // Try finding lead directly if the ID is a lead ID
            const lead = await prisma.lead.findUnique({
                where: { id }
            })

            if (lead) {
                await prisma.lead.update({
                    where: { id },
                    data: {
                        ...(aiLabel !== undefined && { aiLabel }),
                        ...(isRead !== undefined && { isRead }),
                        ...(isStarred !== undefined && { isStarred }),
                        ...(isArchived !== undefined && { isArchived }),
                    }
                })
                return NextResponse.json({ success: true })
            }

            return NextResponse.json({ error: "Email/Lead not found" }, { status: 404 })
        }

        // Update the lead
        await prisma.lead.update({
            where: { id: event.leadId },
            data: {
                ...(aiLabel !== undefined && { aiLabel }),
                ...(isRead !== undefined && { isRead }),
                ...(isStarred !== undefined && { isStarred }),
                ...(isArchived !== undefined && { isArchived }),
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to update email:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
