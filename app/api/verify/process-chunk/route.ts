import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmail } from '@/lib/email-verifier'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { jobId, batchSize = 50 } = body

        if (!jobId) {
            return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
        }

        const job = await prisma.verificationJob.findUnique({
            where: { id: jobId }
        })

        if (!job) {
            return NextResponse.json({ error: 'Job not found or deleted' }, { status: 404 })
        }

        if (job.userId && job.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

        // Count verified items
        const verifiedCount = await prisma.verificationResultItem.count({
            where: { jobId }
        })

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

        // Headers
        let headers: string[] = []
        try {
            headers = JSON.parse(job.headers)
        } catch {
            headers = ['email']
        }

        let emailField = headers.find(h => /^(email|e-mail|email_address|email address|work email|contact email|mail)$/i.test(h.trim()))
        if (!emailField) emailField = headers.find(h => /email/i.test(h)) || headers[0]

        // Parse rows (handles both compact 2D array and legacy object array)
        let rawDataRows: any[] = []
        try {
            if ((job as any).rawRowsJson) {
                rawDataRows = JSON.parse((job as any).rawRowsJson)
            }
        } catch {}

        const nextBatchRaw = rawDataRows.slice(verifiedCount, verifiedCount + batchSize)

        if (nextBatchRaw.length === 0) {
            await prisma.verificationJob.update({
                where: { id: jobId },
                data: { status: 'completed', progress: 100, completedAt: new Date() }
            })
            return NextResponse.json({ completed: true, progress: 100 })
        }

        // Convert batch items into standard key-value records
        const nextBatch: Array<Record<string, string>> = nextBatchRaw.map((row: any) => {
            if (Array.isArray(row)) {
                const rec: Record<string, string> = {}
                headers.forEach((h, idx) => {
                    rec[h] = String(row[idx] ?? '')
                })
                return rec
            }
            return (row && typeof row === 'object') ? row : { [emailField!]: String(row || '') }
        })

        // Process chunk concurrently with live checks
        let validInc = 0
        let riskyInc = 0
        let invalidInc = 0
        let disposableInc = 0
        let lastLog = job.currentLog || ''

        const verifiedItems = await Promise.all(
            nextBatch.map(async (row) => {
                const rawEmail = (row[emailField!] || '').trim()

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
                } else {
                    try {
                        result = await verifyEmail(rawEmail)
                    } catch {
                        result = {
                            email: rawEmail,
                            status: 'risky' as const,
                            reason: 'DNS timeout or network unreachable',
                            score: 50,
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
