import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET all labels for user
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const labels = await prisma.leadLabel.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(labels)
}

// POST create new label
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, description } = body

    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const label = await prisma.leadLabel.create({
        data: {
            name,
            color: color || '#3b82f6',
            description,
            userId: session.user.id
        }
    })

    return NextResponse.json(label)
}
