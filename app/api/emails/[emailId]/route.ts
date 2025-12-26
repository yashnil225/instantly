import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// DELETE - Permanently delete an email
export async function DELETE(
    request: Request,
    { params }: { params: { emailId: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.email.delete({
            where: { id: params.emailId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete email:', error)
        return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 })
    }
}
