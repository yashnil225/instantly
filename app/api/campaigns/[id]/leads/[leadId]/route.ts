import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; leadId: string }> }
) {
    try {
        const { id, leadId } = await params

        await prisma.lead.delete({
            where: { id: leadId }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        if (error.code === 'P2025') {
            // Record already deleted, treat as success
            return NextResponse.json({ success: true })
        }
        console.error('Failed to delete lead:', error)
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }
}
