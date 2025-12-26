import { NextResponse } from 'next/server'
import { syncAllAccounts } from '@/lib/imap-sync'

export async function POST() {
    try {
        await syncAllAccounts()
        return NextResponse.json({ success: true, message: 'Sync completed' })
    } catch (error) {
        console.error('Manual sync failed:', error)
        return NextResponse.json(
            { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
