import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, opportunityValue } = body

        // Verify ownership or admin role
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: params.id,
                OR: [
                    { userId: session.user.id },
                    {
                        members: {
                            some: {
                                userId: session.user.id,
                                role: { in: ["owner", "admin"] }
                            }
                        }
                    }
                ]
            }
        })

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found or unauthorized" }, { status: 404 })
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: params.id },
            data: {
                name,
                opportunityValue: opportunityValue !== undefined ? parseFloat(opportunityValue) : undefined
            }
        })

        return NextResponse.json(updatedWorkspace)
    } catch (error) {
        console.error("Failed to update workspace:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
