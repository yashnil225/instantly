/**
 * Complete Warmup Cron Job
 * 
 * This endpoint orchestrates all warmup activities:
 * 1. Send warmup emails (peer-to-peer and pool)
 * 2. Detect incoming warmup emails
 * 3. Auto-reply to warmup emails
 * 4. Rescue warmup emails from spam
 * 5. Update warmup statistics
 * 
 * Should be called every 30-60 minutes via a cron scheduler
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { detectWarmupEmails, rescueFromSpam } from '@/lib/warmup-detection'
import { processWarmupReplies } from '@/lib/warmup-reply'
import { runPoolWarmupCycle, updateWarmupScores } from '@/lib/warmup-pool'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for Vercel

// Warmup email templates
const WARMUP_SUBJECTS = [
    "Quick question about the project",
    "Meeting follow up",
    "Regarding your recent update",
    "Integration details",
    "Checking in",
    "Q4 planning update",
    "Resource allocation",
    "Timeline discussion",
    "Project status update",
    "Quick sync needed"
]

const WARMUP_BODIES = [
    "Hi, just wanted to check if you received my previous email? Thanks.",
    "Hello, could we schedule a time to discuss the integration steps? Let me know.",
    "Hi there, I noticed a small issue with the config, can you check? Best.",
    "Hey, do you have the latest report? I need it for the meeting. Cheers.",
    "Just checking in to see how things are going. Hope all is well!",
    "Hi, wanted to follow up on our discussion from last week.",
    "Hello, any updates on the project timeline? Let me know.",
    "Hi there, thanks for your patience. I'll have updates soon.",
    "Hey, just a quick reminder about the meeting tomorrow.",
    "Hi, hope you're doing well! Let me know if you need anything."
]

export async function GET(request: Request) {
    const startTime = Date.now()
    console.log("🔥 Starting Complete Warmup Engine...")

    const results = {
        peerToPeer: { sent: 0, errors: [] as string[] },
        pool: { sent: 0, errors: 0 },
        detection: { found: 0, accounts: 0 },
        replies: { sent: 0 },
        spamRescue: { rescued: 0 },
        duration: 0
    }

    try {
        // Get all warmup-enabled accounts
        const accounts = await prisma.emailAccount.findMany({
            where: {
                status: 'active',
                warmupEnabled: true
            }
        })

        console.log(`📧 Found ${accounts.length} warmup-enabled accounts`)

        if (accounts.length < 2) {
            return NextResponse.json({
                message: "Not enough accounts for warmup. Need at least 2 accounts.",
                ...results
            })
        }

        // ========================================
        // PHASE 1: Send Peer-to-Peer Warmup Emails
        // ========================================
        console.log("📤 Phase 1: Sending peer-to-peer warmup emails...")

        const shuffled = [...accounts].sort(() => 0.5 - Math.random())

        for (let i = 0; i < shuffled.length; i++) {
            const sender = shuffled[i]
            const receiver = shuffled[(i + 1) % shuffled.length]

            // Check daily limit
            if ((sender.warmupSentToday || 0) >= (sender.warmupMaxPerDay || 10)) {
                continue
            }

            try {
                const transporter = nodemailer.createTransport({
                    host: sender.smtpHost!,
                    port: sender.smtpPort!,
                    secure: sender.smtpPort === 465,
                    auth: { user: sender.smtpUser!, pass: sender.smtpPass! }
                })

                const subject = WARMUP_SUBJECTS[Math.floor(Math.random() * WARMUP_SUBJECTS.length)]
                const body = WARMUP_BODIES[Math.floor(Math.random() * WARMUP_BODIES.length)]
                const warmupId = `warmup_${Date.now()}_${Math.random().toString(36).substring(7)}`

                await transporter.sendMail({
                    from: `"${sender.firstName} ${sender.lastName}" <${sender.email}>`,
                    to: receiver.email,
                    subject,
                    text: body,
                    headers: {
                        'X-Instantly-Warmup': 'true',
                        'X-Warmup-ID': warmupId
                    }
                })

                console.log(`🔥 P2P: ${sender.email} -> ${receiver.email}`)

                await prisma.emailAccount.update({
                    where: { id: sender.id },
                    data: { warmupSentToday: { increment: 1 } }
                })

                results.peerToPeer.sent++
            } catch (err: any) {
                console.error(`P2P fail ${sender.email}:`, err.message)
                results.peerToPeer.errors.push(`${sender.email}: ${err.message}`)
            }
        }

        // ========================================
        // PHASE 2: Pool Warmup (cross-domain)
        // ========================================
        console.log("🌐 Phase 2: Running pool warmup...")

        try {
            const poolResults = await runPoolWarmupCycle()
            results.pool = poolResults
        } catch (err) {
            console.error("Pool warmup failed:", err)
        }

        // ========================================
        // PHASE 3: Detect & Process Incoming Warmup Emails
        // ========================================
        console.log("📥 Phase 3: Detecting incoming warmup emails...")

        for (const account of accounts) {
            if (!account.imapHost || !account.imapPass) continue

            try {
                const detection = await detectWarmupEmails(account)
                results.detection.found += detection.totalFound
                results.detection.accounts++

                // Auto-reply to warmup emails
                if (detection.needsReply.length > 0) {
                    const replied = await processWarmupReplies(account, detection.needsReply)
                    results.replies.sent += replied
                }

                // Rescue from spam
                if (detection.inSpam.length > 0) {
                    const rescued = await rescueFromSpam(account)
                    results.spamRescue.rescued += rescued
                }
            } catch (err) {
                console.error(`Detection failed for ${account.email}:`, err)
            }
        }

        // ========================================
        // PHASE 4: Update Warmup Scores
        // ========================================
        console.log("📊 Phase 4: Updating warmup scores...")
        await updateWarmupScores()

        results.duration = Date.now() - startTime

        console.log("✅ Warmup cycle complete:", results)

        return NextResponse.json({
            success: true,
            ...results
        })

    } catch (error) {
        console.error("Warmup Engine Failed:", error)
        return NextResponse.json({
            error: "Internal Error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// POST endpoint to manually trigger warmup for specific account
export async function POST(request: Request) {
    try {
        const { accountId, action } = await request.json()

        if (!accountId) {
            return NextResponse.json({ error: "accountId required" }, { status: 400 })
        }

        const account = await prisma.emailAccount.findUnique({
            where: { id: accountId }
        })

        if (!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 })
        }

        switch (action) {
            case 'spam-rescue':
                const rescued = await rescueFromSpam(account)
                return NextResponse.json({ success: true, rescued })

            case 'detect':
                const detection = await detectWarmupEmails(account)
                return NextResponse.json({ success: true, ...detection })

            case 'toggle-pool':
                const newOptIn = !account.warmupPoolOptIn
                await prisma.emailAccount.update({
                    where: { id: accountId },
                    data: { warmupPoolOptIn: newOptIn }
                })
                return NextResponse.json({ success: true, poolOptIn: newOptIn })

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 })
        }
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
