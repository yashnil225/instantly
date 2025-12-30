import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/v2/workspaces
 * List all workspaces for the current user
 */
export async function GET(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        // Get workspaces where user is the owner
        const ownedWorkspaces = await prisma.workspace.findMany({
            where: { ownerId: auth.user.id },
            include: {
                _count: { select: { campaigns: true } }
            }
        })

        // Get workspaces user is a member of
        const memberWorkspaces = await prisma.workspaceMember.findMany({
            where: { userId: auth.user.id },
            include: {
                workspace: {
                    include: {
                        _count: { select: { campaigns: true } }
                    }
                }
            }
        })

        return NextResponse.json({
            owned: ownedWorkspaces.map(w => ({
                id: w.id,
                name: w.name,
                campaignCount: w._count.campaigns,
                role: "owner"
            })),
            member: memberWorkspaces.map(m => ({
                id: m.workspace.id,
                name: m.workspace.name,
                campaignCount: m.workspace._count.campaigns,
                role: m.role
            }))
        })
    } catch (error) {
        console.error("API GET /v2/workspaces error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/**
 * POST /api/v2/workspaces
 * Create a new workspace (for agency mode)
 */
export async function POST(req: NextRequest) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    try {
        const { name, clientEmail } = await req.json()

        if (!name) {
            return NextResponse.json({ error: "Workspace name is required" }, { status: 400 })
        }

        const workspace = await prisma.workspace.create({
            data: {
                name,
                ownerId: auth.user.id
            }
        })

        // If client email provided, invite them
        if (clientEmail) {
            // Create invitation record (would need email sending in production)
            await prisma.workspaceInvitation.create({
                data: {
                    workspaceId: workspace.id,
                    email: clientEmail,
                    role: "client",
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            })
        }

        return NextResponse.json({
            message: "Workspace created",
            workspace: {
                id: workspace.id,
                name: workspace.name
            },
            ...(clientEmail && { invitationSent: clientEmail })
        }, { status: 201 })
    } catch (error) {
        console.error("API POST /v2/workspaces error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
