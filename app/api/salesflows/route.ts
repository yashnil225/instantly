import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const nameFilter = searchParams.get('name')?.toLowerCase()

        // For now, return mock salesflows since we may not have a Salesflow model
        // In production, you would query: await prisma.salesflow.findMany(...)
        let salesflows = [
            { id: '1', name: 'Outbound Sales', leadCount: 45, userId: session.user.id },
            { id: '2', name: 'Inbound Leads', leadCount: 23, userId: session.user.id },
            { id: '3', name: 'Partner Referrals', leadCount: 12, userId: session.user.id }
        ]

        if (nameFilter) {
            salesflows = salesflows.filter(s => s.name.toLowerCase().includes(nameFilter))
        }

        return NextResponse.json(salesflows)
    } catch (error) {
        console.error('Failed to fetch salesflows:', error)
        return NextResponse.json({ error: 'Failed to fetch salesflows' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Mock creation - in production would be:
        // const salesflow = await prisma.salesflow.create({ data: { name, userId: session.user.id } })
        const salesflow = {
            id: Date.now().toString(),
            name,
            leadCount: 0,
            userId: session.user.id
        }

        return NextResponse.json(salesflow)
    } catch (error) {
        console.error('Failed to create salesflow:', error)
        return NextResponse.json({ error: 'Failed to create salesflow' }, { status: 500 })
    }
}
