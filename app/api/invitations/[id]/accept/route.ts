import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { id }
        })

        if (!invitation) {
            return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
        }

        if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        if (invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
            return NextResponse.json({ error: "Invitation is expired or already processed" }, { status: 400 })
        }

        // Check if user is already a member
        const isMember = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: invitation.workspaceId,
                    userId: session.user.id
                }
            }
        })

        if (!isMember) {
            await prisma.workspaceMember.create({
                data: {
                    workspaceId: invitation.workspaceId,
                    userId: session.user.id,
                    role: invitation.role
                }
            })
        }

        // Mark as accepted
        await prisma.invitation.update({
            where: { id },
            data: { status: 'accepted' }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to accept invitation:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
