import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const logs = await prisma.webhookLog.findMany({
            where: {
                webhook: {
                    userId: session.user.id
                }
            },
            include: {
                webhook: {
                    select: {
                        name: true,
                        url: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 50
        })

        // Calculate stats
        const stats = await prisma.webhookLog.groupBy({
            by: ["isSuccess"],
            where: {
                webhook: {
                    userId: session.user.id
                }
            },
            _count: true
        })

        const total = stats.reduce((acc, curr) => acc + curr._count, 0)
        const successful = stats.find(s => s.isSuccess)?._count || 0
        const failed = stats.find(s => !s.isSuccess)?._count || 0
        const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : "0.0"

        return NextResponse.json({
            logs,
            stats: {
                total,
                successful,
                failed,
                successRate: `${successRate}%`
            }
        })
    } catch (error) {
        console.error("API GET /user/webhooks/activity error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
