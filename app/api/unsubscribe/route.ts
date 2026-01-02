import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 })
        }

        // Find lead by unsubscribe token
        const lead = await prisma.lead.findUnique({
            where: { unsubscribeToken: token }
        })

        if (!lead) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
        }

        // Update lead status to unsubscribed
        await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'unsubscribed' }
        })

        return NextResponse.json({ success: true, message: 'Successfully unsubscribed' })
    } catch (error) {
        console.error('Unsubscribe error:', error)
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }
}
