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

        await prisma.emailAccount.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        })

        return NextResponse.json({ success: true, deleted: ids.length })
    } catch (error) {
        console.error('Bulk delete error:', error)
        return NextResponse.json(
            { error: 'Failed to delete accounts' },
            { status: 500 }
        )
    }
}
