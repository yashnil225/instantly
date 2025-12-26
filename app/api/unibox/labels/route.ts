import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }


        const body = await request.json()
        const { name, color } = body

        if (!name) {
            return NextResponse.json({ error: "Label name is required" }, { status: 400 })
        }

        // In a real app, you'd store custom labels in a separate table
        // For now, we'll just return the label format
        const label = {
            id: `custom_${Date.now()}`,
            name,
            color: color || "blue",
            type: "custom"
        }

        return NextResponse.json(label)
    } catch (error) {
        console.error("Failed to create label:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
