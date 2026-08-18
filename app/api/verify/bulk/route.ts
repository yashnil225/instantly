import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmail } from '@/lib/email-verifier'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseSmartCsv(content: string): { headers: string[]; rows: Array<Record<string, string>>; emailField: string } {
    const parsed = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => (h || '').trim()
    })

    const rawHeaders = (parsed.meta.fields || []).filter(Boolean)
    const rawRows = parsed.data || []

    if (rawHeaders.length === 0 || rawRows.length === 0) {
        return { headers: [], rows: [], emailField: '' }
    }

    // Smart Email Column Detection: score each column based on how many valid @ emails it contains
    let bestEmailField = ''
    let bestEmailScore = -1

    for (const header of rawHeaders) {
        const hLower = header.toLowerCase()
        let score = 0

        // Bonus for standard naming
        if (/^(email|e-mail|email_address|email address|work email|contact email|mail)$/i.test(hLower)) {
            score += 100
        } else if (hLower.includes('email') || hLower.includes('mail')) {
            score += 50
        }

        // Count actual valid emails in the first 50 rows
        const sample = rawRows.slice(0, 50)
        let validCountInSample = 0
        for (const row of sample) {
            const val = (row[header] || '').trim()
            if (EMAIL_REGEX.test(val)) {
                validCountInSample++
            }
        }

        score += (validCountInSample * 10)

        if (score > bestEmailScore && validCountInSample > 0) {
            bestEmailScore = score
            bestEmailField = header
        }
    }

    // Fallback if no obvious header
    if (!bestEmailField) {
        bestEmailField = rawHeaders[0]
    }

    // Filter out rows where the email field is empty or is an accidental duplicate header row
    const validRows = rawRows.filter(row => {
        const val = (row[bestEmailField] || '').trim()
        if (!val) return false
        // Exclude accidental duplicate header rows inside the CSV
        if (val.toLowerCase() === bestEmailField.toLowerCase() || val.toLowerCase() === 'email') return false
        return true
    })

    return { headers: rawHeaders, rows: validRows, emailField: bestEmailField }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const text = await file.text()
        const { headers, rows, emailField } = parseSmartCsv(text)

        if (rows.length === 0) {
            return NextResponse.json({ error: 'CSV file contains no valid email leads' }, { status: 400 })
        }

        // --- 1. Enforce 30-Job Capacity Limit (FIFO) ---
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
                currentLog: `Identified ${rows.length} leads in column "${emailField}". Starting verification...`,
                headers: JSON.stringify(headers)
            }
        })

        // --- 3. Run Async Processing with High Concurrency & Zero-Stall Guarantees ---
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
    const CONCURRENCY = 10
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
            const idx = currentIndex++
            if (idx >= rows.length) break

            // Check if job was deleted or canceled by user
            if (idx % 25 === 0) {
                const jobCheck = await prisma.verificationJob.findUnique({
                    where: { id: jobId },
                    select: { status: true }
                })
                if (!jobCheck || jobCheck.status === 'canceled') {
                    return
                }
            }

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
                    result = await verifyEmail(rawEmail, { timeoutMs: 2000 })
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

            // Save to DB in batches of 20 or when finished
            if (itemsToInsert.length >= 20 || processed >= rows.length) {
                await flushItems()
                const progress = Math.min(100, Math.round((processed / rows.length) * 100))
                const icon = result.status === 'valid' ? '✅' : result.status === 'risky' ? '🟡' : '❌'
                const currentLog = `${icon} [${processed}/${rows.length}] ${rawEmail} → ${result.status.toUpperCase()} (${result.reason})`

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

            // Minimal 10ms yield
            await new Promise(r => setTimeout(r, 10))
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
