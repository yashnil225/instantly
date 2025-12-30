import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const webhooks = await prisma.webhook.findMany({
            where: { userId: session.user.id },
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
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
                userId: session.user.id
            }
        })
        return NextResponse.json(webhook)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
    }
}
