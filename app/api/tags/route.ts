import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET all custom tags for user
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tags = await prisma.customTag.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tags)
}

// POST create new tag
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { label, description } = body

    if (!label) {
        return NextResponse.json({ error: 'Label is required' }, { status: 400 })
    }

    const tag = await prisma.customTag.create({
        data: {
            label,
            description,
            userId: session.user.id
        }
    })

    return NextResponse.json(tag)
}
