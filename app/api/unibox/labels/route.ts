import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }


        const body = await request.json()
        const { name, color } = body

        if (!name) {
            return NextResponse.json({ error: "Label name is required" }, { status: 400 })
        }

        const label = await prisma.leadLabel.create({
            data: {
                name,
                color: color || "#3b82f6",
                userId: session.user.id
            }
        })

        return NextResponse.json(label)
    } catch (error) {
        console.error("Failed to create label:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
