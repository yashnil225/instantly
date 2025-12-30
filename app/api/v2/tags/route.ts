import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const tags = await prisma.tag.findMany({
            where: { userId: auth.user.id },
            orderBy: { name: "asc" }
        })
        return NextResponse.json(tags)
    } catch (error) {
        console.error("API GET /v2/tags error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const { name, color } = await req.json()
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                color: color || "#3b82f6",
                userId: auth.user.id
            }
        })
        return NextResponse.json(tag)
    } catch (error) {
        console.error("API POST /v2/tags error:", error)
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
    }
}
