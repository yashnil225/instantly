import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const webhooks = await prisma.webhook.findMany({
            where: { userId: auth.user.id },
            orderBy: { createdAt: "desc" }
        })

        const formattedWebhooks = webhooks.map((w: any) => ({
            ...w,
            events: JSON.parse(w.events)
        }))

        return NextResponse.json(formattedWebhooks)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    try {
        const { url, name, events } = await req.json()
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 })
        }

        const webhook = await prisma.webhook.create({
            data: {
                url,
                name,
                events: JSON.stringify(events || ["*"]),
                userId: auth.user.id
            }
        })
        return NextResponse.json(webhook)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
    }
}
