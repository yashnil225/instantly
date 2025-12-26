import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PATCH update label
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

    const label = await prisma.leadLabel.update({
        where: { id, userId: session.user.id },
        data: {
            name: body.name ?? undefined,
            color: body.color ?? undefined,
            description: body.description ?? undefined
        }
    })

    return NextResponse.json(label)
}

// DELETE label
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.leadLabel.delete({
        where: { id, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
}
