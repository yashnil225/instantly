import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Papa from 'papaparse'
import { normalizeLead } from '@/lib/leads'

const prisma = new PrismaClient()

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const formData = await request.formData()
        const file = formData.get('file') as File
        const checkDuplicates = formData.get('checkDuplicates') !== 'false'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const text = await file.text()

        // Parse CSV
        const parseResult = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.toLowerCase().trim()
        })

        if (parseResult.errors.length > 0) {
            console.error('CSV Parsing errors:', parseResult.errors)
        }

        const records = parseResult.data as any[]
        const leadsToInsert: any[] = []
        const emailsToCheck: string[] = []

        for (const record of records) {
            const normalized = normalizeLead(record)
            if (normalized) {
                emailsToCheck.push(normalized.email)
                leadsToInsert.push({
                    email: normalized.email,
                    firstName: normalized.firstName,
                    lastName: normalized.lastName,
                    company: normalized.company,
                    campaignId: id,
                    status: 'new'
                })
            }
        }

        if (leadsToInsert.length === 0) {
            return NextResponse.json({ error: 'No valid leads found with email addresses' }, { status: 400 })
        }

        let duplicatesSkipped = 0
        let finalLeads = leadsToInsert

        // Check for duplicates across all campaigns if enabled
        if (checkDuplicates) {
            const existingLeads = await prisma.lead.findMany({
                where: { email: { in: emailsToCheck } },
                select: { email: true }
            })

            const existingEmails = new Set(existingLeads.map(l => l.email.toLowerCase()))

            finalLeads = leadsToInsert.filter(lead => {
                const isDuplicate = existingEmails.has(lead.email.toLowerCase())
                if (isDuplicate) duplicatesSkipped++
                return !isDuplicate
            })
        }

        if (finalLeads.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                duplicatesSkipped,
                message: `All ${duplicatesSkipped} leads were duplicates and skipped`
            })
        }

        // Bulk insert
        const createdLeads = await prisma.lead.createMany({
            data: finalLeads,
            skipDuplicates: true
        })

        // Update campaign timestamp
        await prisma.campaign.update({
            where: { id },
            data: { updatedAt: new Date() }
        })

        return NextResponse.json({
            success: true,
            count: createdLeads.count,
            duplicatesSkipped,
            message: `Imported ${createdLeads.count} leads${duplicatesSkipped > 0 ? `, skipped ${duplicatesSkipped} duplicates` : ''}`
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
    }
}
