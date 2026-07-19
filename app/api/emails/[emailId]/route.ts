import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// DELETE - Permanently delete an email
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ emailId: string }> }
) {
    const { emailId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Unibox passes the Lead ID (as 'emailId') because it groups emails by lead.
        // We delete all events associated with this lead to clear the conversation thread.
        await prisma.sendingEvent.deleteMany({
            where: { leadId: emailId }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        // Handle race condition where records were already deleted
        if (error.code === 'P2025') {
            return NextResponse.json({ success: true, message: 'Already deleted' })
        }
        console.error('Failed to delete email:', error)
        return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 })
    }
}
