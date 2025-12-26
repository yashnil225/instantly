import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.notification.update({
            where: { id: params.id },
            data: { read: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to mark as read:", error)
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }
}
