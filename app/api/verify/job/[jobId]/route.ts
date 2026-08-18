import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
    const { jobId } = params

    const job = await prisma.verificationJob.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        return NextResponse.json({ error: 'Job not found or already deleted' }, { status: 404 })
    }

    return NextResponse.json(job)
}

export async function DELETE(request: Request, { params }: { params: { jobId: string } }) {
    const { jobId } = params

    try {
        await prisma.verificationJob.delete({
            where: { id: jobId }
        })
        return NextResponse.json({ success: true, message: 'Job and all verification results deleted from Database' })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Job not found' }, { status: 404 })
    }
}

export async function POST(request: Request, { params }: { params: { jobId: string } }) {
    const { jobId } = params
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'download'
    const filterType = url.searchParams.get('type') || 'all' // all, valid, risky, invalid

    const job = await prisma.verificationJob.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 })
    }

    if (action === 'cancel') {
        await prisma.verificationJob.update({
            where: { id: jobId },
            data: { status: 'canceled', currentLog: '❌ Canceled by user' }
        })
        return NextResponse.json({ success: true, message: 'Job canceled' })
    }

    // Generate Filtered CSV from Database
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

    const exportHeaders = [...originalHeaders, 'verification_status', 'verification_reason', 'verification_score']
    const uniqueHeaders = Array.from(new Set(exportHeaders))

    const csvLines: string[] = []
    csvLines.push(uniqueHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(','))

    for (const item of items) {
        let rowObj: Record<string, any> = {}
        try {
            rowObj = JSON.parse(item.rowData)
        } catch {
            rowObj = { email: item.email }
        }

        rowObj.verification_status = item.status
        rowObj.verification_reason = item.reason || ''
        rowObj.verification_score = item.score

        const line = uniqueHeaders.map(h => {
            const val = rowObj[h] !== undefined && rowObj[h] !== null ? String(rowObj[h]) : ''
            return `"${val.replace(/"/g, '""')}"`
        }).join(',')
        csvLines.push(line)
    }

    const csvData = csvLines.join('\r\n')
    const fileName = `${filterType}-verified-${job.fileName.replace(/\.[^/.]+$/, '')}.csv`

    return new Response(csvData, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${fileName}"`
        }
    })
}
