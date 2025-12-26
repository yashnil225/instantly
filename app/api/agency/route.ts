import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET agency settings
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    // Get or create agency settings
    let settings = await prisma.agencySettings.findUnique({
        where: { workspaceId }
    })

    if (!settings) {
        settings = await prisma.agencySettings.create({
            data: { workspaceId }
        })
    }

    // Get agency clients
    const clients = await prisma.agencyClient.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ settings, clients })
}

// PUT update agency settings
export async function PUT(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, customDomain, logoUrl } = body

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    const settings = await prisma.agencySettings.upsert({
        where: { workspaceId },
        update: {
            customDomain: customDomain ?? undefined,
            logoUrl: logoUrl ?? undefined
        },
        create: {
            workspaceId,
            customDomain,
            logoUrl
        }
    })

    return NextResponse.json(settings)
}

// POST add client
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, email, permissions } = body

    if (!workspaceId || !email) {
        return NextResponse.json({ error: 'workspaceId and email required' }, { status: 400 })
    }

    const client = await prisma.agencyClient.create({
        data: {
            workspaceId,
            email,
            permissions: permissions || 'view'
        }
    })

    return NextResponse.json(client)
}

// DELETE client
export async function DELETE(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
        return NextResponse.json({ error: 'clientId required' }, { status: 400 })
    }

    await prisma.agencyClient.delete({
        where: { id: clientId }
    })

    return NextResponse.json({ success: true })
}
