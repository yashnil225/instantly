import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        const result = await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        })

        return NextResponse.json({
            success: true,
            count: result.count
        })
    } catch (error) {
        console.error("Failed to mark all as read:", error)
        return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 })
    }
}
