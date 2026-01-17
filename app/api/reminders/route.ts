import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const reminders = await prisma.reminder.findMany({
            where: {
                userId: session.user.id,
                status: "pending"
            },
            include: {
                lead: true
            },
            orderBy: {
                scheduledAt: "asc"
            }
        })

        return NextResponse.json(reminders)
    } catch (error) {
        console.error("Failed to fetch reminders:", error)
        return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
        }

        const reminder = await prisma.reminder.update({
            where: { id, userId: session.user.id },
            data: { status }
        })

        return NextResponse.json(reminder)
    } catch (error) {
        console.error('Failed to update reminder:', error)
        return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
    }
}
