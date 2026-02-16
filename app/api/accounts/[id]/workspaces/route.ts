import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update workspace assignments for an account
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { workspaceIds } = body

        if (!Array.isArray(workspaceIds)) {
            return NextResponse.json({ error: 'workspaceIds must be an array' }, { status: 400 })
        }

        // Verify account exists and belongs to user
        const account = await prisma.emailAccount.findFirst({
            where: { 
                id,
                userId: session.user.id
            }
        })

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }

        // Delete existing workspace assignments
        await prisma.emailAccountWorkspace.deleteMany({
            where: { emailAccountId: id }
        })

        // Create new workspace assignments
        if (workspaceIds.length > 0) {
            await prisma.emailAccountWorkspace.createMany({
                data: workspaceIds.map((workspaceId: string) => ({
                    emailAccountId: id,
                    workspaceId
                }))
            })
        }

        // Return updated account with workspaces
        const updatedAccount = await prisma.emailAccount.findUnique({
            where: { id },
            include: {
                workspaces: {
                    include: {
                        workspace: true
                    }
                }
            }
        })

        return NextResponse.json(updatedAccount)
    } catch (error) {
        console.error('Failed to update account workspaces:', error)
        return NextResponse.json({ error: 'Failed to update workspaces' }, { status: 500 })
    }
}

// GET - Get workspace assignments for an account
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params

        const workspaces = await prisma.emailAccountWorkspace.findMany({
            where: { emailAccountId: id },
            include: {
                workspace: true
            }
        })

        return NextResponse.json(workspaces)
    } catch (error) {
        console.error('Failed to fetch account workspaces:', error)
        return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }
}
