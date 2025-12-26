import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PATCH update tag
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

    const tag = await prisma.customTag.update({
        where: { id, userId: session.user.id },
        data: {
            label: body.label ?? undefined,
            description: body.description ?? undefined
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

    const { id } = await params

    await prisma.customTag.delete({
        where: { id, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
}
