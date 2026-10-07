import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email) {
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

        await prisma.invitation.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to reject invitation:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
