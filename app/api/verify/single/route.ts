import { NextResponse } from 'next/server'
import { verifyEmail } from '@/lib/email-verifier'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
        }

        const result = await verifyEmail(email.trim())
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error in single email verification:', error)
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
    }
}
