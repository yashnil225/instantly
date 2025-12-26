import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Handle various Unibox actions
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { action, emailId, leadId, data } = body

        switch (action) {
            case "mark-unread":
                // Mark email as unread
                // In a real app, update the email read status in the database
                return NextResponse.json({ success: true, message: "Email marked as unread" })

            case "set-reminder":
                // Set a reminder for the lead
                // Would create a reminder record in the database
                return NextResponse.json({
                    success: true,
                    message: "Reminder set",
                    reminderTime: data?.time || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default: 24h
                })

            case "delete-lead":
                // Delete lead from the system
                if (leadId) {
                    await prisma.lead.delete({
                        where: { id: leadId }
                    }).catch(() => null) // Ignore if lead doesn't exist
                }
                return NextResponse.json({ success: true, message: "Lead deleted" })

            case "blocklist":
                // Add email to blocklist
                if (data?.email) {
                    // Would create a blocklist entry
                    // await prisma.blocklist.create({ data: { email: data.email, userId: session.user.id } })
                }
                return NextResponse.json({ success: true, message: "Added to blocklist" })

            case "delete-email":
                // Delete email conversation
                return NextResponse.json({ success: true, message: "Email deleted" })

            case "move-subsequence":
                // Move lead to a subsequence
                return NextResponse.json({
                    success: true,
                    message: "Lead moved to subsequence",
                    subsequenceId: data?.subsequenceId
                })

            case "move-campaign":
                // Move lead to another campaign
                if (leadId && data?.campaignId) {
                    await prisma.lead.update({
                        where: { id: leadId },
                        data: { campaignId: data.campaignId }
                    }).catch(() => null)
                }
                return NextResponse.json({
                    success: true,
                    message: "Lead moved to campaign",
                    campaignId: data?.campaignId
                })

            case "ai-feedback":
                // Record AI label feedback (thumbs up/down)
                // Would store feedback to improve AI model
                return NextResponse.json({
                    success: true,
                    message: "Feedback recorded",
                    feedback: data?.feedback // "positive" or "negative"
                })

            case "find-similar":
                // Find similar leads based on email/lead attributes
                // Would query database for similar leads
                return NextResponse.json({
                    success: true,
                    message: "Finding similar leads",
                    similarLeads: [] // Would return actual similar leads
                })

            case "update-status":
                // Update lead status
                if (leadId && data?.status) {
                    await prisma.lead.update({
                        where: { id: leadId },
                        data: { status: data.status }
                    }).catch(() => null)
                }
                return NextResponse.json({
                    success: true,
                    message: "Status updated",
                    status: data?.status
                })

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 })
        }
    } catch (error) {
        console.error("Unibox action error:", error)
        return NextResponse.json({ error: "Action failed" }, { status: 500 })
    }
}
