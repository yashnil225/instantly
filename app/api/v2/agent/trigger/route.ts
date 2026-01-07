import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { checkReplies, AutomationFilter } from '@/lib/replies'
import { processBatch } from '@/lib/sender'

export const maxDuration = 60 // Allow up to 60s for Pro plans

export async function POST(req: NextRequest) {
    // 1. Authenticate
    const auth = await validateApiKey(req)
    if (!auth.isValid) {
        return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    try {
        const body = await req.json()

        // 2. Parse Options
        const action: string = body.action || 'both' // 'reply', 'send', 'both'
        const filter: AutomationFilter = body.filter || {}

        console.log(`[Agent Trigger] Action: ${action}, Filter:`, filter)

        let replyResult = null
        let sendResult = null

        // 3. Execute Actions
        if (action === 'reply' || action === 'both') {
            replyResult = await checkReplies({ filter })
            console.log(`[Agent Trigger] Replies: ${replyResult.detected} detected`)
        }

        if (action === 'send' || action === 'both') {
            sendResult = await processBatch({ filter })
            console.log(`[Agent Trigger] Sent: ${sendResult.totalSent} emails`)
        }

        // 4. Return Report
        return NextResponse.json({
            success: true,
            action,
            filter,
            results: {
                replies: replyResult,
                sent: sendResult
            }
        })

    } catch (error: any) {
        console.error('[Agent Trigger] Error:', error)
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
    }
}
