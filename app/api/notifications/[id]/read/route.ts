import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        await prisma.notification.updateMany({
            where: { id, userId: session.user.id },
            data: { read: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to mark as read:", error)
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }
}
