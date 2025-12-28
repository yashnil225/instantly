import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: workspaceId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const workspace = await prisma.workspace.update({
            where: {
                id: workspaceId,
                userId: session.user.id // Only owner can rename
            },
            data: { name }
        })

        return NextResponse.json(workspace)
    } catch (error) {
        console.error("[WORKSPACE PATCH ERROR]:", error)
        return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: workspaceId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Find if it's the default workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId }
        })

        if (workspace?.isDefault) {
            return NextResponse.json({ error: 'Cannot delete default workspace' }, { status: 400 })
        }

        await prisma.workspace.delete({
            where: {
                id: workspaceId,
                userId: session.user.id // Only owner can delete
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[WORKSPACE DELETE ERROR]:", error)
        return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
    }
}
