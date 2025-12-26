import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
    try {
        // In a real app, get userId from session
        const userId = "demo-user"

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
