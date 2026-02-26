import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60 // Allow longer for large file processing

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // 25MB limit check (25 * 1024 * 1024 bytes)
        const MAX_SIZE = 25 * 1024 * 1024
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds 25MB limit' },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        const attachment = await prisma.attachment.create({
            data: {
                filename: file.name,
                mimeType: file.type || 'application/octet-stream',
                size: file.size,
                content: buffer
            }
        })

        return NextResponse.json({
            id: attachment.id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType
        })

    } catch (error) {
        console.error('Attachment upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload attachment' },
            { status: 500 }
        )
    }
}
