import { NextResponse } from 'next/server'
import { sendWarmupEmails } from '@/lib/warmup'
import { runPoolWarmupCycle } from '@/lib/warmup-pool'
import { processWarmupMaintenance } from '@/lib/warmup-detection'
import { createTimeoutGuard } from '@/lib/timeout-guard'
import { waitUntil } from '@vercel/functions'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Hobby plan hard limit

// Simple phase rotation: each cron invocation runs ONE phase to stay under 60s.
// Phase rotates via a module-level counter persisted across warm starts.
let lastPhase = 0

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        const secret = process.env.CRON_SECRET || process.env.AUTHORIZATION
        const isValid = authHeader === `Bearer ${secret}` || authHeader === secret
        if (!isValid) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    // Respond IMMEDIATELY so cron-job.org doesn't kill the connection.
    waitUntil(runWarmupTasks())

    return NextResponse.json({ success: true, message: 'Warmup tasks started in background' })
}

async function runWarmupTasks() {
    // 20s guard = 40s buffer before Hobby 60s hard kill
    const guard = createTimeoutGuard(20_000)

    // Deterministic phase rotation across serverless cold starts:
    // Rotates every 5 minutes based on epoch time (Phase 1 → 2 → 3 → 1)
    const timeSlot = Math.floor(Date.now() / (1000 * 60 * 5))
    const phase = (timeSlot % 3) + 1

    console.log(`[Warmup] Running phase ${phase}/3 (20s budget, timeSlot ${timeSlot})...`)

    try {
        const phasePromise = (async () => {
            switch (phase) {
                case 1:
                    await sendWarmupEmails(guard)
                    console.log(`[Warmup] Phase 1 (send) done (${guard.elapsedSec()}s)`)
                    break

                case 2:
                    const poolResults = await runPoolWarmupCycle(guard)
                    console.log(`[Warmup] Phase 2 (pool) done — Sent ${poolResults.sent}, Errors ${poolResults.errors} (${guard.elapsedSec()}s)`)
                    break

                case 3:
                    await processWarmupMaintenance(guard)
                    console.log(`[Warmup] Phase 3 (maintenance) done (${guard.elapsedSec()}s)`)
                    break
            }
        })()

        let timeoutId: NodeJS.Timeout
        const ceilingPromise = new Promise<void>((resolve) => {
            timeoutId = setTimeout(() => {
                console.warn(`[Warmup] Hard 22s ceiling reached in phase ${phase}, exiting safely`)
                resolve()
            }, 22000)
        })

        await Promise.race([phasePromise, ceilingPromise])
        clearTimeout(timeoutId!)
    } catch (error: any) {
        console.error(`[Warmup] Phase ${phase} failed:`, error?.message || error)
    }
}
