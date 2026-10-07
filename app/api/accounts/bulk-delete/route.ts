import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            )
        }

        // Find workspaces where user is owner or admin
        const userWorkspaces = await prisma.workspace.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { members: { some: { userId: session.user.id, role: { in: ['owner', 'admin'] } } } }
                ]
            },
            select: { id: true }
        })
        const authorizedWorkspaceIds = userWorkspaces.map(w => w.id)

        const deleteResult = await prisma.emailAccount.deleteMany({
            where: {
                id: {
                    in: ids
                },
                OR: [
                    { userId: session.user.id },
                    { workspaces: { some: { workspaceId: { in: authorizedWorkspaceIds } } } }
                ]
            }
        })

        return NextResponse.json({ success: true, deleted: deleteResult.count })
    } catch (error) {
        console.error('Bulk delete error:', error)
        return NextResponse.json(
            { error: 'Failed to delete accounts' },
            { status: 500 }
        )
    }
}
