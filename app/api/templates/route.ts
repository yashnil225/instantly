import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const templates = await prisma.template.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { isPublic: true }
                ]
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(templates)
    } catch (error) {
        console.error('[TEMPLATES_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { name, subject, body: templateBody, category } = body

        if (!name || !subject || !templateBody) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const template = await prisma.template.create({
            data: {
                name,
                subject,
                body: templateBody,
                category: category || 'Custom',
                userId: session.user.id,
                isPublic: false
            }
        })

        return NextResponse.json(template)
    } catch (error) {
        console.error('[TEMPLATES_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
