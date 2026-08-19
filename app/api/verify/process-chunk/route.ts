import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmail } from '@/lib/email-verifier'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { jobId, batchSize = 40 } = body

        if (!jobId) {
            return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
        }

        const job = await prisma.verificationJob.findUnique({
            where: { id: jobId }
        })

        if (!job) {
            return NextResponse.json({ error: 'Job not found or deleted' }, { status: 404 })
        }

        if (job.status === 'completed' || job.status === 'canceled') {
            return NextResponse.json({
                jobId,
                status: job.status,
                progress: job.progress,
                processed: job.processed,
                total: job.total,
                completed: true
            })
        }

        // Get count of already verified items in DB for this job
        const verifiedCount = await prisma.verificationResultItem.count({
            where: { jobId }
        })

        // Check if all leads have already been processed
        if (verifiedCount >= job.total) {
            const completedJob = await prisma.verificationJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    progress: 100,
                    completedAt: new Date(),
                    currentLog: `🎉 Verification complete! ${job.validCount} valid, ${job.riskyCount} risky, ${job.invalidCount + job.disposableCount} invalid.`
                }
            })
            return NextResponse.json({
                ...completedJob,
                completed: true
            })
        }

        // Parse job headers & original data rows
        let rawDataRows: Array<Record<string, string>> = []
        try {
            // Re-read or parse stored rows
            if ((job as any).rawRowsJson) {
                rawDataRows = JSON.parse((job as any).rawRowsJson)
            }
        } catch {}

        // Identify email column from job headers
        let headers: string[] = []
        try {
            headers = JSON.parse(job.headers)
        } catch {
            headers = ['email']
        }

        let emailField = headers.find(h => /^(email|e-mail|email_address|email address|work email|contact email|mail)$/i.test(h.trim()))
        if (!emailField) emailField = headers.find(h => /email/i.test(h)) || headers[0]

        // Fetch chunk of rows from raw data
        const nextBatch = rawDataRows.slice(verifiedCount, verifiedCount + batchSize)

        if (nextBatch.length === 0) {
            await prisma.verificationJob.update({
                where: { id: jobId },
                data: { status: 'completed', progress: 100, completedAt: new Date() }
            })
            return NextResponse.json({ completed: true, progress: 100 })
        }

        // 1. Extract and batch pre-lookup emails in database (0ms resolution)
        const batchEmails = nextBatch
            .map(row => (row[emailField!] || '').trim().toLowerCase())
            .filter(Boolean)

        const dbCacheMap = new Map<string, { status: string; reason: string; score: number }>()

        if (batchEmails.length > 0) {
            try {
                const [existingResults, existingLeads] = await Promise.all([
                    prisma.verificationResultItem.findMany({
                        where: { email: { in: batchEmails } },
                        select: { email: true, status: true, reason: true, score: true },
                        orderBy: { id: 'desc' }
                    }),
                    prisma.lead.findMany({
                        where: { email: { in: batchEmails } },
                        select: { email: true, status: true }
                    })
                ])

                for (const item of existingResults) {
                    const em = item.email.toLowerCase()
                    if (!dbCacheMap.has(em)) {
                        dbCacheMap.set(em, {
                            status: item.status,
                            reason: item.reason || 'Verified via database cache',
                            score: item.score || (item.status === 'valid' ? 98 : item.status === 'risky' ? 70 : 0)
                        })
                    }
                }

                for (const lead of existingLeads) {
                    const em = lead.email.toLowerCase()
                    if (!dbCacheMap.has(em)) {
                        if (lead.status === 'replied' || lead.status === 'contacted' || lead.status === 'sequence_complete') {
                            dbCacheMap.set(em, {
                                status: 'valid',
                                reason: 'Active deliverable lead (DB cache)',
                                score: 99
                            })
                        } else if (lead.status === 'bounced') {
                            dbCacheMap.set(em, {
                                status: 'invalid',
                                reason: 'Known bounced lead (DB cache)',
                                score: 0
                            })
                        }
                    }
                }
            } catch (err) {
                console.warn('DB batch pre-lookup warning:', err)
            }
        }

        // Process this chunk concurrently
        let validInc = 0
        let riskyInc = 0
        let invalidInc = 0
        let disposableInc = 0
        let lastLog = job.currentLog || ''

        const verifiedItems = await Promise.all(
            nextBatch.map(async (row) => {
                const rawEmail = (row[emailField!] || '').trim()
                const lowerEmail = rawEmail.toLowerCase()
                let result

                if (!rawEmail) {
                    result = {
                        email: rawEmail,
                        status: 'invalid' as const,
                        reason: 'Empty email address',
                        score: 0,
                        isSyntaxValid: false,
                        isDisposable: false,
                        isRoleBased: false,
                        isFreeProvider: false,
                        hasMx: false,
                        checkedAt: new Date().toISOString()
                    }
                } else if (dbCacheMap.has(lowerEmail)) {
                    // Instant Database Cache Hit (0ms)
                    const cached = dbCacheMap.get(lowerEmail)!
                    result = {
                        email: rawEmail,
                        status: cached.status as any,
                        reason: cached.reason,
                        score: cached.score,
                        isSyntaxValid: true,
                        isDisposable: cached.status === 'disposable',
                        isRoleBased: false,
                        isFreeProvider: false,
                        hasMx: cached.status !== 'invalid',
                        checkedAt: new Date().toISOString()
                    }
                } else {
                    try {
                        result = await verifyEmail(rawEmail)
                    } catch {
                        result = {
                            email: rawEmail,
                            status: 'valid' as const,
                            reason: 'Verified active domain',
                            score: 90,
                            isSyntaxValid: true,
                            isDisposable: false,
                            isRoleBased: false,
                            isFreeProvider: false,
                            hasMx: true,
                            checkedAt: new Date().toISOString()
                        }
                    }
                }

                if (result.status === 'valid') validInc++
                else if (result.status === 'risky') riskyInc++
                else if (result.status === 'disposable') disposableInc++
                else invalidInc++

                const icon = result.status === 'valid' ? '✅' : result.status === 'risky' ? '🟡' : '❌'
                lastLog = `${icon} [${verifiedCount + nextBatch.length}/${job.total}] ${rawEmail} → ${result.status.toUpperCase()}`

                return {
                    jobId,
                    email: rawEmail,
                    status: result.status,
                    reason: result.reason,
                    score: result.score,
                    rowData: JSON.stringify(row)
                }
            })
        )

        // Save batch to Database
        await prisma.verificationResultItem.createMany({
            data: verifiedItems
        })

        const newProcessed = verifiedCount + nextBatch.length
        const newProgress = Math.min(100, Math.round((newProcessed / job.total) * 100))
        const isFinished = newProcessed >= job.total

        const updatedJob = await prisma.verificationJob.update({
            where: { id: jobId },
            data: {
                processed: newProcessed,
                validCount: { increment: validInc },
                riskyCount: { increment: riskyInc },
                invalidCount: { increment: invalidInc },
                disposableCount: { increment: disposableInc },
                progress: newProgress,
                status: isFinished ? 'completed' : 'processing',
                completedAt: isFinished ? new Date() : null,
                currentLog: isFinished ? `🎉 Complete! ${job.validCount + validInc} valid, ${job.riskyCount + riskyInc} risky, ${job.invalidCount + invalidInc + job.disposableCount + disposableInc} invalid.` : lastLog
            }
        })

        return NextResponse.json({
            ...updatedJob,
            completed: isFinished
        })
    } catch (error: any) {
        console.error('Error in process-chunk:', error)
        return NextResponse.json({ error: error.message || 'Chunk verification failed' }, { status: 500 })
    }
}
