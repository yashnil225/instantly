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
        const tags = searchParams.get("tags")?.split(',').filter(Boolean) || []

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
        if (filter === "starred") where.isStarred = true

        if (tags.length > 0) {
            where.tags = {
                some: {
                    tagId: { in: tags }
                }
            }
        }

        // Snooze Logic
        if (filter === "snoozed") {
            where.snoozedUntil = { not: null, gt: new Date() } // Show future snoozed
        } else if (filter === "archived") {
            where.isArchived = true
        } else {
            // Default Inbox view: Not archived AND (Not snoozed OR Snooze expired)
            where.isArchived = false
            where.OR = [
                { snoozedUntil: null },
                { snoozedUntil: { lte: new Date() } }
            ]
        }



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
        // Primary/Others tab filtering
        if (tab === "primary") {
            // Primary: Human replies (exclude auto-replies like OOO)
            // Use AND to combine with existing aiLabel filter if present
            const tabCondition = { notIn: ["out_of_office", "auto_reply", "unsubscribed"] }
            if (where.aiLabel) {
                where.AND = [
                    ...(where.AND || []),
                    { aiLabel: where.aiLabel },
                    { aiLabel: tabCondition }
                ]
                delete where.aiLabel
            } else {
                where.aiLabel = tabCondition
            }
        } else if (tab === "others") {
            // Others: Auto-replies and system-generated responses
            const tabCondition = { in: ["out_of_office", "auto_reply", "unsubscribed"] }
            if (where.aiLabel) {
                where.AND = [
                    ...(where.AND || []),
                    { aiLabel: where.aiLabel },
                    { aiLabel: tabCondition }
                ]
                delete where.aiLabel
            } else {
                where.aiLabel = tabCondition
            }
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
        // Parse search query for operators
        if (search) {
            const operators: any = {}
            let plainTextSearch = search

            // Extract operators
            const fromMatch = search.match(/from:(\S+)/i)
            const subjectMatch = search.match(/subject:(\S+)/i)
            const hasAttachmentMatch = search.match(/has:attachment/i)

            // Date operators
            const afterMatch = search.match(/after:(\d{4}\/\d{2}\/\d{2})/i) // YYYY/MM/DD
            const beforeMatch = search.match(/before:(\d{4}\/\d{2}\/\d{2})/i)

            // Status operators
            const isUnreadMatch = search.match(/is:unread/i)
            const isReadMatch = search.match(/is:read/i)
            const isStarredMatch = search.match(/is:starred/i)
            const inArchivedMatch = search.match(/(in:archived|is:archived)/i)

            if (fromMatch) {
                operators.email = fromMatch[1]
                plainTextSearch = plainTextSearch.replace(/from:\S+/gi, '').trim()
            }

            if (subjectMatch) {
                operators.subject = subjectMatch[1]
                plainTextSearch = plainTextSearch.replace(/subject:\S+/gi, '').trim()
            }

            if (hasAttachmentMatch) {
                operators.hasAttachment = true
                plainTextSearch = plainTextSearch.replace(/has:attachment/gi, '').trim()
            }

            if (afterMatch) {
                where.updatedAt = { ...where.updatedAt, gte: new Date(afterMatch[1]) }
                plainTextSearch = plainTextSearch.replace(/after:\S+/gi, '').trim()
            }

            if (beforeMatch) {
                where.updatedAt = { ...where.updatedAt, lte: new Date(beforeMatch[1]) }
                plainTextSearch = plainTextSearch.replace(/before:\S+/gi, '').trim()
            }

            if (isUnreadMatch) {
                where.isRead = false
                plainTextSearch = plainTextSearch.replace(/is:unread/gi, '').trim()
            }

            if (isReadMatch) {
                where.isRead = true
                plainTextSearch = plainTextSearch.replace(/is:read/gi, '').trim()
            }

            if (isStarredMatch) {
                where.isStarred = true
                plainTextSearch = plainTextSearch.replace(/is:starred/gi, '').trim()
            }

            if (inArchivedMatch) {
                where.isArchived = true
                plainTextSearch = plainTextSearch.replace(/(in:archived|is:archived)/gi, '').trim()
            }

            // Build search conditions
            const searchConditions: any[] = []

            // Apply operator filters
            if (operators.email) {
                searchConditions.push({ email: { contains: operators.email, mode: 'insensitive' } })
            }

            if (operators.subject) {
                // Filter by subject in event metadata
                where.events = {
                    ...where.events,
                    some: {
                        ...where.events?.some,
                        metadata: { contains: `"subject":"${operators.subject}`, mode: 'insensitive' }
                    }
                }
            }

            if (operators.hasAttachment) {
                // Filter by attachment presence
                where.events = {
                    ...where.events,
                    some: {
                        ...where.events?.some,
                        hasAttachment: true
                    }
                }
            }

            // Add plain text search if any remains
            if (plainTextSearch) {
                searchConditions.push(
                    { email: { contains: plainTextSearch, mode: 'insensitive' } },
                    { firstName: { contains: plainTextSearch, mode: 'insensitive' } },
                    { lastName: { contains: plainTextSearch, mode: 'insensitive' } },
                    { company: { contains: plainTextSearch, mode: 'insensitive' } }
                )
            }

            // Apply search conditions
            if (searchConditions.length > 0) {
                where.OR = searchConditions
            }
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
                    orderBy: { createdAt: "asc" }, // Ascending for threaded view
                    take: 100,
                    include: {
                        emailAccount: {
                            select: {
                                email: true
                            }
                        }
                    }
                },
                tags: {
                    include: {
                        tag: true
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

            // Check if any event has attachments
            const hasAttachment = lead.events.some(e => e.hasAttachment)

            return {
                id: lead.id,

                fromName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email,
                company: lead.company,
                subject: replyEvent ? "Re: " + (sentEvent?.metadata ? JSON.parse(sentEvent.metadata).subject : "Follow up") : (sentEvent?.metadata ? JSON.parse(sentEvent.metadata).subject : "Follow up"),
                preview,
                timestamp: lead.updatedAt,
                isRead: lead.isRead,
                isStarred: lead.isStarred,
                isArchived: lead.isArchived,
                snoozedUntil: lead.snoozedUntil,
                status: lead.status,
                aiLabel: lead.aiLabel,
                campaign: lead.campaign,
                hasReply: !!replyEvent,
                hasAttachment,
                sentFrom: lastEvent?.emailAccount?.email,
                from: lastEvent?.type === 'sent' ? lastEvent.emailAccount?.email : lead.email,
                to: lastEvent?.type === 'sent' ? lead.email : lastEvent?.emailAccount?.email,
                isMe: lastEvent?.type === 'sent',
                tags: lead.tags.map(t => t.tag)
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
        const { leadId, isRead, aiLabel, status, isStarred, isArchived, snoozedUntil } = body

        const updated = await prisma.lead.update({
            where: { id: leadId },
            data: {
                ...(typeof isRead === "boolean" && { isRead }),
                ...(aiLabel !== undefined && { aiLabel }),
                ...(status && { status }),
                ...(typeof isStarred === "boolean" && { isStarred }),
                ...(typeof isArchived === "boolean" && { isArchived }),
                ...(snoozedUntil !== undefined && { snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : null })
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Failed to update email:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
