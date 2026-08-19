import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params
    const session = await auth()
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const filterType = url.searchParams.get('type') || 'all' // all, valid, risky, invalid

    const job = await prisma.verificationJob.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        return NextResponse.json({ error: 'Job not found or already deleted' }, { status: 404 })
    }

    if (job.userId && session?.user?.id && job.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If standard status poll, return JSON
    if (action !== 'download') {
        return NextResponse.json(job)
    }

    // --- Direct CSV Download Generation ---
    const whereClause: any = { jobId }
    if (filterType === 'valid') {
        whereClause.status = 'valid'
    } else if (filterType === 'risky') {
        whereClause.status = 'risky'
    } else if (filterType === 'invalid') {
        whereClause.status = { in: ['invalid', 'disposable'] }
    }

    const items = await prisma.verificationResultItem.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' }
    })

    let originalHeaders: string[] = []
    try {
        originalHeaders = JSON.parse(job.headers)
    } catch {
        originalHeaders = ['email']
    }

    const fullExportHeaders = [...originalHeaders, 'verification_status', 'verification_reason', 'verification_score']
    const uniqueHeaders = Array.from(new Set(fullExportHeaders))

    const exportRows: Array<Record<string, any>> = []

    for (const item of items) {
        let rowObj: Record<string, any> = {}
        try {
            rowObj = JSON.parse(item.rowData)
        } catch {
            rowObj = { email: item.email }
        }

        // Attach verified data
        rowObj.verification_status = item.status
        rowObj.verification_reason = item.reason || ''
        rowObj.verification_score = item.score

        // Ensure proper column order
        const formattedRow: Record<string, any> = {}
        for (const h of uniqueHeaders) {
            formattedRow[h] = rowObj[h] !== undefined && rowObj[h] !== null ? rowObj[h] : ''
        }
        exportRows.push(formattedRow)
    }

    // Use Papa.unparse for 100% standard CSV output
    const csvData = Papa.unparse({
        fields: uniqueHeaders,
        data: exportRows
    })

    const cleanBaseName = job.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
    const downloadFileName = `${filterType}-verified-${cleanBaseName}.csv`

    return new Response(csvData, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${downloadFileName}"`,
            'Cache-Control': 'no-cache'
        }
    })
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params
    const session = await auth()

    try {
        const job = await prisma.verificationJob.findUnique({ where: { id: jobId } })
        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

        if (job.userId && session?.user?.id && job.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.verificationJob.delete({
            where: { id: jobId }
        })
        return NextResponse.json({ success: true, message: 'Job and all verification results deleted from Database' })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Job not found' }, { status: 404 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'cancel'

    if (action === 'cancel') {
        await prisma.verificationJob.update({
            where: { id: jobId },
            data: { status: 'canceled', currentLog: '❌ Canceled by user' }
        })
        return NextResponse.json({ success: true, message: 'Job canceled' })
    }

    return NextResponse.json({ success: true })
}
