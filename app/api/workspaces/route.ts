import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const workspaces = await prisma.workspace.findMany({
            where: {
                OR: [
                    { userId: session.user.id }, // Owner
                    { members: { some: { userId: session.user.id } } } // Member
                ]
            },
            include: {
                members: { 
                    include: { user: true }
                },
                _count: {
                    select: { 
                        campaignWorkspaces: true,
                        members: true 
                    }
                }
            },
            orderBy: [
                { isDefault: 'desc' }, // Show default workspace first
                { createdAt: 'desc' }  // Then newest first
            ]
        })

        return NextResponse.json(workspaces)
    } catch (error) {
        console.error("Failed to fetch workspaces:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, opportunityValue } = body

        if (!name) {
            return NextResponse.json({ error: "Workspace name is required" }, { status: 400 })
        }

        const newWorkspace = await prisma.workspace.create({
            data: {
                name,
                opportunityValue: opportunityValue ? parseFloat(opportunityValue) : 5000,
                userId: session.user.id,
                isDefault: false,
                members: {
                    create: {
                        userId: session.user.id,
                        role: "owner"
                    }
                }
            }
        })

        return NextResponse.json(newWorkspace)
    } catch (error) {
        console.error("Failed to create workspace:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
