import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const invitations = await prisma.invitation.findMany({
            where: {
                email: session.user.email.toLowerCase().trim(),
                status: 'pending',
                expiresAt: { gt: new Date() }
            },
            include: {
                workspace: { select: { name: true } },
                inviter: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(invitations)
    } catch (error) {
        console.error("Failed to fetch invitations:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
