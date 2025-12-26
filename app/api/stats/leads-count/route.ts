import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const count = await prisma.lead.count()

        return NextResponse.json({ count })
    } catch (error) {
        console.error("Failed to fetch lead count:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
