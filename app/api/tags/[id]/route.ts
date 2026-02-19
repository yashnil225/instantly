import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PATCH update tag (rename)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const tag = await prisma.tag.update({
        where: { id, userId: session.user.id },
        data: {
            name: body.name ?? undefined,
            color: body.color ?? undefined
        }
    })

    return NextResponse.json(tag)
}

// DELETE tag
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params

        // Check if tag is in use
        const tag = await prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        campaigns: true,
                        accounts: true,
                        leads: true
                    }
                }
            }
        })

        if (!tag) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        if (tag.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const totalUsage = tag._count.campaigns + tag._count.accounts + tag._count.leads

        // Delete the tag (cascade will remove associations)
        await prisma.tag.delete({
            where: { id }
        })

        return NextResponse.json({ 
            success: true,
            usageCount: totalUsage
        })
    } catch (error) {
        console.error('Failed to delete tag:', error)
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }
}
