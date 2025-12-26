import { NextResponse } from 'next/server'
import { checkReplies } from '@/lib/replies'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await checkReplies()
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error("Reply Cron Job Failed", error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
