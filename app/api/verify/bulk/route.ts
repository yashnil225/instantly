import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmail } from '@/lib/email-verifier'

export const dynamic = 'force-dynamic'

function parseCsv(content: string): { headers: string[]; rows: Array<Record<string, string>> } {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length === 0) return { headers: [], rows: [] }

    const parseLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^["']|["']$/g, ''))
                current = ''
            } else {
                current += char
            }
        }
        result.push(current.trim().replace(/^["']|["']$/g, ''))
        return result
    }

    const headers = parseLine(lines[0])
    const rows: Array<Record<string, string>> = []

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
            row[h] = values[idx] || ''
        })
        rows.push(row)
    }

    return { headers, rows }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const text = await file.text()
        const { headers, rows } = parseCsv(text)

        if (rows.length === 0) {
            return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 })
        }

        // Identify email column
        let emailField = headers.find(h => /^(email|e-mail|email_address|email address|mail)$/i.test(h.trim()))
        if (!emailField) {
            emailField = headers.find(h => /email/i.test(h))
        }
        if (!emailField) {
            for (const h of headers) {
                if (rows.slice(0, 5).some(r => (r[h] || '').includes('@'))) {
                    emailField = h
                    break
                }
            }
        }
        if (!emailField) {
            emailField = headers[0]
        }

        // --- 1. Enforce 30-Job Capacity Limit (FIFO: 31st job deletes the oldest) ---
        const totalExistingJobs = await prisma.verificationJob.count()
        if (totalExistingJobs >= 30) {
            const jobsToDelete = await prisma.verificationJob.findMany({
                orderBy: { createdAt: 'asc' },
                take: (totalExistingJobs - 29),
                select: { id: true }
            })
            if (jobsToDelete.length > 0) {
                await prisma.verificationJob.deleteMany({
                    where: { id: { in: jobsToDelete.map(j => j.id) } }
                })
            }
        }

        // --- 2. Create Job in Database ---
        const newJob = await prisma.verificationJob.create({
            data: {
                fileName: file.name,
                total: rows.length,
                processed: 0,
                validCount: 0,
                riskyCount: 0,
                invalidCount: 0,
                disposableCount: 0,
                progress: 0,
                status: 'processing',
                currentLog: 'Starting email verification in database...',
                headers: JSON.stringify(headers)
            }
        })

        // --- 3. Run Async Processing in Background ---
        runDatabaseVerification(newJob.id, rows, emailField)

        return NextResponse.json({
            jobId: newJob.id,
            total: rows.length,
            fileName: file.name,
            emailField
        })
    } catch (error: any) {
        console.error('Error in bulk verification:', error)
        return NextResponse.json({ error: error.message || 'Failed to start bulk verification' }, { status: 500 })
    }
}

async function runDatabaseVerification(jobId: string, rows: Array<Record<string, string>>, emailField: string) {
    const CONCURRENCY = 4
    let currentIndex = 0
    let processed = 0
    let validCount = 0
    let riskyCount = 0
    let invalidCount = 0
    let disposableCount = 0

    const itemsToInsert: Array<{
        jobId: string
        email: string
        status: string
        reason: string
        score: number
        rowData: string
    }> = []

    async function flushItems() {
        if (itemsToInsert.length === 0) return
        const batch = [...itemsToInsert]
        itemsToInsert.length = 0
        try {
            await prisma.verificationResultItem.createMany({
                data: batch
            })
        } catch (e) {
            console.error('Failed to flush items batch to DB', e)
        }
    }

    async function processNext(): Promise<void> {
        while (currentIndex < rows.length) {
            // Check if job was deleted or canceled by user
            const jobCheck = await prisma.verificationJob.findUnique({
                where: { id: jobId },
                select: { status: true }
            })
            if (!jobCheck || jobCheck.status === 'canceled') {
                return
            }

            const idx = currentIndex++
            if (idx >= rows.length) break

            const row = rows[idx]
            const rawEmail = (row[emailField] || '').trim()

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
                    result = await verifyEmail(rawEmail, { timeoutMs: 3500 })
                } catch {
                    result = {
                        email: rawEmail,
                        status: 'risky' as const,
                        reason: 'Verification probe timed out',
                        score: 60,
                        isSyntaxValid: true,
                        isDisposable: false,
                        isRoleBased: false,
                        isFreeProvider: false,
                        hasMx: true,
                        checkedAt: new Date().toISOString()
                    }
                }
            }

            processed++
            if (result.status === 'valid') validCount++
            else if (result.status === 'risky') riskyCount++
            else if (result.status === 'disposable') disposableCount++
            else invalidCount++

            itemsToInsert.push({
                jobId,
                email: rawEmail,
                status: result.status,
                reason: result.reason,
                score: result.score,
                rowData: JSON.stringify(row)
            })

            // Save to DB in batches of 10 or when finished
            if (itemsToInsert.length >= 10 || processed >= rows.length) {
                await flushItems()
                const progress = Math.round((processed / rows.length) * 100)
                const icon = result.status === 'valid' ? '✅' : result.status === 'risky' ? '🟡' : '❌'
                const currentLog = `${icon} ${rawEmail || '(empty)'} → ${result.status.toUpperCase()} (${result.reason})`

                await prisma.verificationJob.update({
                    where: { id: jobId },
                    data: {
                        processed,
                        validCount,
                        riskyCount,
                        invalidCount,
                        disposableCount,
                        progress,
                        currentLog
                    }
                }).catch(() => {})
            }

            // Small 40ms pacing
            await new Promise(r => setTimeout(r, 40))
        }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => processNext())
    await Promise.all(workers)

    await flushItems()

    // Mark as completed
    const finalJob = await prisma.verificationJob.findUnique({
        where: { id: jobId },
        select: { status: true }
    })
    if (finalJob && finalJob.status === 'processing') {
        await prisma.verificationJob.update({
            where: { id: jobId },
            data: {
                status: 'completed',
                progress: 100,
                completedAt: new Date(),
                currentLog: `🎉 Verification complete! ${validCount} valid, ${riskyCount} risky, ${invalidCount + disposableCount} invalid.`
            }
        }).catch(() => {})
    }
}
