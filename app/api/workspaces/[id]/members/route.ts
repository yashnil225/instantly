import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Ensure user has access to workspace
        const hasAccess = await prisma.workspace.findFirst({
            where: {
                id,
                OR: [
                    { userId: session.user.id },
                    { members: { some: { userId: session.user.id } } }
                ]
            }
        })

        if (!hasAccess) {
            return NextResponse.json({ error: "Workspace not found or unauthorized" }, { status: 404 })
        }

        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId: id },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' }
        })

        const invitations = await prisma.invitation.findMany({
            where: { 
                workspaceId: id,
                status: 'pending',
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ members, invitations })
    } catch (error) {
        console.error("Failed to fetch members:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { email, role } = body

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Check if user has permission to invite (owner or admin)
        const canInvite = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: id,
                userId: session.user.id,
                role: { in: ["owner", "admin"] }
            }
        })

        const isOwner = await prisma.workspace.findFirst({
            where: { id: id, userId: session.user.id }
        })

        if (!canInvite && !isOwner) {
            return NextResponse.json({ error: "Unauthorized to invite members" }, { status: 403 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })

        if (existingUser) {
            // Check if already a member
            const isMember = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: id,
                        userId: existingUser.id
                    }
                }
            })

            if (isMember) {
                return NextResponse.json({ error: "User is already a member" }, { status: 400 })
            }

            // Add directly
            const member = await prisma.workspaceMember.create({
                data: {
                    workspaceId: id,
                    userId: existingUser.id,
                    role: role || 'member'
                },
                include: { user: true }
            })
            return NextResponse.json(member)
        } else {
            // Create or update existing invitation
            const invitation = await prisma.invitation.upsert({
                where: {
                    workspaceId_email: {
                        workspaceId: id,
                        email: normalizedEmail
                    }
                },
                create: {
                    email: normalizedEmail,
                    workspaceId: id,
                    role: role || 'member',
                    token: Math.random().toString(36).substring(7),
                    inviterId: session.user.id,
                    status: 'pending',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                },
                update: {
                    role: role || 'member',
                    token: Math.random().toString(36).substring(7),
                    inviterId: session.user.id,
                    status: 'pending',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            })

            return NextResponse.json({ invitation, message: "Invitation created (mock email sent)" })
        }
    } catch (error) {
        console.error("Failed to invite member:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get("memberId")
        const invitationId = searchParams.get("invitationId")

        // Check if user has permission (owner or admin)
        const canManage = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: id,
                userId: session.user.id,
                role: { in: ["owner", "admin"] }
            }
        })

        const isOwner = await prisma.workspace.findFirst({
            where: { id: id, userId: session.user.id }
        })

        if (!canManage && !isOwner) {
            return NextResponse.json({ error: "Unauthorized to manage members" }, { status: 403 })
        }

        if (memberId) {
            const member = await prisma.workspaceMember.findUnique({
                where: { id: memberId }
            })

            if (!member || member.workspaceId !== id) {
                return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 })
            }

            if (member.role === "owner") {
                return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 400 })
            }

            await prisma.workspaceMember.delete({
                where: { id: memberId }
            })

            return NextResponse.json({ success: true, message: "Member removed" })
        }

        if (invitationId) {
            const invitation = await prisma.invitation.findUnique({
                where: { id: invitationId }
            })

            if (!invitation || invitation.workspaceId !== id) {
                return NextResponse.json({ error: "Invitation not found in this workspace" }, { status: 404 })
            }

            await prisma.invitation.delete({
                where: { id: invitationId }
            })

            return NextResponse.json({ success: true, message: "Invitation revoked" })
        }

        return NextResponse.json({ error: "Missing memberId or invitationId" }, { status: 400 })
    } catch (error) {
        console.error("Failed to delete member or invitation:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
