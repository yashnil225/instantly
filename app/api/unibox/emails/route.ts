import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }


        const { searchParams } = new URL(request.url)

        // Filters
        const status = searchParams.get("status")
        const campaignId = searchParams.get("campaignId")
        const emailAccountId = searchParams.get("emailAccountId")
        const aiLabel = searchParams.get("aiLabel")
        const tab = searchParams.get("tab") // "primary" or "others"
        const filter = searchParams.get("filter") // "unread", "reminders", "scheduled", "sent"
        const search = searchParams.get("search")
        const workspaceIds = searchParams.get("workspaceIds")?.split(',').filter(Boolean)

        // Build where clause
        const where: any = {
            // Only show leads that have REPLIED (not just sent)
            events: {
                some: {
                    type: "reply"
                }
            }
        }

        if (status) where.status = status
        if (campaignId) where.campaignId = campaignId
        if (aiLabel) where.aiLabel = aiLabel
        if (filter === "unread") where.isRead = false
        if (emailAccountId) {
            where.events = {
                ...where.events,
                some: {
                    ...where.events?.some,
                    emailAccountId: emailAccountId
                }
            }
        }

        // Primary/Others tab filtering
        if (tab === "primary") {
            // Primary: Human replies (exclude auto-replies like OOO)
            where.aiLabel = { notIn: ["out_of_office", "auto_reply", "unsubscribed"] }
        } else if (tab === "others") {
            // Others: Auto-replies and system-generated responses
            where.aiLabel = { in: ["out_of_office", "auto_reply", "unsubscribed"] }
        }

        // Filter by workspace(s) through campaign
        if (workspaceIds && workspaceIds.length > 0) {
            where.campaign = {
                campaignWorkspaces: {
                    some: {
                        workspaceId: {
                            in: workspaceIds
                        }
                    }
                }
            }
        }
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { company: { contains: search } }
            ]
        }

        // Fetch leads with their latest events
        const leads = await prisma.lead.findMany({
            where,
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                events: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: {
                        emailAccount: {
                            select: {
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: "desc" },
            take: 50
        })

        // Transform to email format for Unibox
        const emails = leads.map(lead => {
            const lastEvent = lead.events[0]
            const replyEvent = lead.events.find(e => e.type === "reply")
            const sentEvent = lead.events.find(e => e.type === "sent")

            // Get preview from reply content if available - show full content
            let preview = "Waiting for response"
            if (replyEvent?.details) {
                preview = replyEvent.details.trim()
            } else if (replyEvent) {
                preview = "Replied to your email"
            }

            return {
                id: lead.id,
                from: lead.email,
                fromName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email,
                company: lead.company,
                subject: replyEvent ? "Re: " + (sentEvent?.metadata ? JSON.parse(sentEvent.metadata).subject : "Follow up") : (sentEvent?.metadata ? JSON.parse(sentEvent.metadata).subject : "Follow up"),
                preview,
                timestamp: lead.updatedAt,
                isRead: lead.isRead,
                status: lead.status,
                aiLabel: lead.aiLabel,
                campaign: lead.campaign,
                hasReply: !!replyEvent,
                sentFrom: lastEvent?.emailAccount?.email
            }
        })

        return NextResponse.json(emails)
    } catch (error) {
        console.error("Failed to fetch emails:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Update email (mark as read, apply label, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }


        const body = await request.json()
        const { leadId, isRead, aiLabel, status } = body

        const updated = await prisma.lead.update({
            where: { id: leadId },
            data: {
                ...(typeof isRead === "boolean" && { isRead }),
                ...(aiLabel !== undefined && { aiLabel }),
                ...(status && { status })
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Failed to update email:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
