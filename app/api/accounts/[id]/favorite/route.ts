import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const existing = await prisma.emailAccount.findUnique({
            where: { id },
            select: { isFavorite: true }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }

        const updated = await prisma.emailAccount.update({
            where: { id },
            data: { isFavorite: !existing.isFavorite }
        })

        return NextResponse.json({ success: true, isFavorite: updated.isFavorite })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update favorite' },
            { status: 500 }
        )
    }
}
