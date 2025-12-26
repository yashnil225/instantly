
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const account = await prisma.emailAccount.findFirst()
        if (!account) return NextResponse.json({ error: "No account found" }, { status: 404 })

        await prisma.emailAccount.update({
            where: { id: account.id },
            data: {
                status: "error",
                errorDetail: "550-5.4.5 Daily user sending limit exceeded. For more information on Gmail limits go to support.google.com"
            }
        })

        return NextResponse.json({ success: true, accountId: account.id })
    } catch (error) {
        return NextResponse.json({ error: "Failed to set error" }, { status: 500 })
    }
}
