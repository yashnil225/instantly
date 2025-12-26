import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        // 1. Check DB Connection
        await prisma.$queryRaw`SELECT 1`

        // 2. Upsert Demo User
        const email = 'demo@instantly.com'
        const password = await bcrypt.hash('password', 10)

        const user = await prisma.user.upsert({
            where: { email },
            update: {}, // Don't change password if exists
            create: {
                email,
                name: 'Demo User',
                password,
            },
        })

        return NextResponse.json({
            status: 'ok',
            message: 'Database Connected & User Ready',
            user: { id: user.id, email: user.email }
        })
    } catch (error: any) {
        console.error("Setup Error:", error)
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
