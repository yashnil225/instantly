import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "20")
        const offset = parseInt(searchParams.get("offset") || "0")
        const unreadOnly = searchParams.get("unreadOnly") === "true"

        // In a real app, get userId from session
        const userId = "demo-user"

        const where: any = { userId }
        if (unreadOnly) {
            where.read = false
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset
            }),
            prisma.notification.count({
                where: { userId, read: false }
            })
        ])

        return NextResponse.json({
            notifications: notifications.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                link: n.link,
                read: n.read,
                createdAt: n.createdAt.toISOString(),
                metadata: n.metadata ? JSON.parse(n.metadata) : null
            })),
            unreadCount
        })
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { type, title, message, link, metadata } = body

        // In a real app, get userId from session
        const userId = "demo-user"

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        })

        return NextResponse.json({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            read: notification.read,
            createdAt: notification.createdAt.toISOString()
        })
    } catch (error) {
        console.error("Failed to create notification:", error)
        return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }
}
