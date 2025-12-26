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
        const body = await request.json()
        const { type, leads, emails, url } = body
        const campaignId = id

        let leadsToProcess: any[] = []

        if (type === 'manual' && emails) {
            // Manual email entry - strings only
            // Convert to object structure for normalizeLead
            leadsToProcess = emails.map((e: string) => ({ email: e }))
        } else if (type === 'sheets' && url) {
            // Google Sheets import
            try {
                // Extract sheet ID from URL
                const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
                if (!match) {
                    return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 })
                }

                const sheetId = match[1]
                const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

                const response = await fetch(csvUrl)
                if (!response.ok) {
                    return NextResponse.json({ error: 'Could not access Google Sheet. Make sure it is public.' }, { status: 400 })
                }

                const csvText = await response.text()

                // Use PapaParse which is robust for CSVs (quotes, etc)
                const parseResult = Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (h) => h.toLowerCase().trim()
                })

                leadsToProcess = parseResult.data
            } catch (err) {
                console.error('Google Sheets import error:', err)
                return NextResponse.json({ error: 'Failed to import from Google Sheets' }, { status: 500 })
            }
        } else if (leads && Array.isArray(leads)) {
            // Direct leads array (raw objects)
            leadsToProcess = leads
        } else {
            return NextResponse.json({ error: 'Invalid import data' }, { status: 400 })
        }

        // Normalize and Deduplicate locally
        const validLeads: any[] = []
        const emailsToCheck: string[] = []

        for (const record of leadsToProcess) {
            const normalized = normalizeLead(record)
            if (normalized) {
                // Local dedup
                if (!emailsToCheck.includes(normalized.email)) {
                    emailsToCheck.push(normalized.email)
                    validLeads.push({
                        ...normalized,
                        campaignId,
                        status: 'new'
                    })
                }
            }
        }

        if (validLeads.length === 0) {
            return NextResponse.json({ error: 'No valid leads found in import' }, { status: 400 })
        }

        // Check DB duplicates
        const existingLeads = await prisma.lead.findMany({
            where: { email: { in: emailsToCheck } },
            select: { email: true }
        })
        const existingEmails = new Set(existingLeads.map(l => l.email.toLowerCase()))

        const newLeads = validLeads.filter(l => !existingEmails.has(l.email))
        const duplicateCount = validLeads.length - newLeads.length

        if (newLeads.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                duplicatesSkipped: duplicateCount,
                message: `All ${duplicateCount} leads were duplicates`
            })
        }

        // Bulk create using batches to avoid transaction limits
        const BATCH_SIZE = 500
        const createdLeads: any[] = []
        
        for (let i = 0; i < newLeads.length; i += BATCH_SIZE) {
            const batch = newLeads.slice(i, i + BATCH_SIZE)
            
            const batchResult = await prisma.$transaction(
                batch.map(lead => prisma.lead.create({
                    data: {
                        email: lead.email,
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        company: lead.company,
                        campaignId: campaignId,
                        status: 'new',
                    }
                }))
            )
            
            createdLeads.push(...batchResult)
        }

        return NextResponse.json({
            success: true,
            count: createdLeads.length,
            duplicatesSkipped: duplicateCount,
            message: `Imported ${createdLeads.length} leads${duplicateCount > 0 ? `, skipped ${duplicateCount} duplicates` : ''}`
        }, { status: 201 })

    } catch (error: any) {
        console.error('Failed to import leads:', error)
        return NextResponse.json({ error: error.message || 'Failed to import leads' }, { status: 500 })
    }
}
