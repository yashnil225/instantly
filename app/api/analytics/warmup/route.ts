import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getWarmupDashboardData } from '@/lib/warmup-analytics'

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const data = await getWarmupDashboardData()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Failed to fetch warmup analytics:', error)
        return NextResponse.json({ error: 'Failed to fetch warmup analytics' }, { status: 500 })
    }
}
