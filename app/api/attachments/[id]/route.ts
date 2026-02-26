import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const attachment = await prisma.attachment.findUnique({
            where: { id }
        })

        if (!attachment) {
            return new Response('Attachment not found', { status: 404 })
        }

        // Return the binary data with correct headers
        return new Response(attachment.content, {
            headers: {
                'Content-Type': attachment.mimeType,
                'Content-Disposition': `inline; filename="${attachment.filename}"`,
                'Content-Length': attachment.size.toString(),
            },
        })

    } catch (error) {
        console.error('Attachment fetch error:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}
