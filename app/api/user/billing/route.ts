import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                plan: true,
                planExpiresAt: true
            }
        })

        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const stats = await prisma.campaignStat.aggregate({
            _sum: {
                sent: true
            },
            where: {
                date: {
                    gte: startOfMonth
                },
                campaign: {
                    OR: [
                        { userId: session.user.id },
                        {
                            campaignWorkspaces: {
                                some: {
                                    workspace: {
                                        members: {
                                            some: {
                                                userId: session.user.id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        })

        return NextResponse.json({
            ...user,
            emailCount: stats._sum.sent || 0
        })
    } catch (error) {
        console.error("[BILLING GET ERROR]:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { plan } = body

        if (!plan) {
            return NextResponse.json({ error: "Plan is required" }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                plan: plan.toLowerCase(),
                planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days
            },
            select: {
                id: true,
                plan: true,
                planExpiresAt: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("[BILLING PATCH ERROR]:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
