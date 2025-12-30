import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const templates = await prisma.template.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { userId: auth.user.id }
                ]
            },
            select: {
                id: true,
                name: true,
                subject: true,
                body: true,
                category: true,
                createdAt: true
            }
        })

        return NextResponse.json(templates)
    } catch (error) {
        console.error("API GET /v2/templates error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const { name, subject, body, category } = await req.json()
        if (!name || !subject || !body) {
            return NextResponse.json({ error: "Name, subject, and body are required" }, { status: 400 })
        }

        const template = await prisma.template.create({
            data: {
                name,
                subject,
                body,
                category,
                userId: auth.user.id
            }
        })
        return NextResponse.json(template)
    } catch (error) {
        console.error("API POST /v2/templates error:", error)
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
    }
}
