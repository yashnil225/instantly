import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Ensure user has access to workspace
        const hasAccess = await prisma.workspace.findFirst({
            where: {
                id: params.id,
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
            where: { workspaceId: params.id },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' }
        })

        const invitations = await prisma.invitation.findMany({
            where: { workspaceId: params.id },
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
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { email, role } = body

        // Check if user has permission to invite (owner or admin)
        const canInvite = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: params.id,
                userId: session.user.id,
                role: { in: ["owner", "admin"] }
            }
        })

        const isOwner = await prisma.workspace.findFirst({
            where: { id: params.id, userId: session.user.id }
        })

        if (!canInvite && !isOwner) {
            return NextResponse.json({ error: "Unauthorized to invite members" }, { status: 403 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } })

        if (existingUser) {
            // Check if already a member
            const isMember = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: params.id,
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
                    workspaceId: params.id,
                    userId: existingUser.id,
                    role: role || 'member'
                },
                include: { user: true }
            })
            return NextResponse.json(member)
        } else {
            // Create invitation
            // For now, simpler implementation: just return success mock since we don't have email sending
            // But we will save to DB

            const invitation = await prisma.invitation.create({
                data: {
                    email,
                    workspaceId: params.id,
                    role: role || 'member',
                    token: Math.random().toString(36).substring(7),
                    inviterId: session.user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            })

            return NextResponse.json({ invitation, message: "Invitation created (mock email sent)" })
        }
    } catch (error) {
        console.error("Failed to invite member:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
