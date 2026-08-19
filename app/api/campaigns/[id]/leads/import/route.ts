import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { normalizeLead } from '@/lib/leads'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { verifyEmail } from '@/lib/email-verifier'
import { getLeadMemoryMap } from '@/lib/lead-memory'

export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        const { id } = await params
        const body = await request.json()
        const { type, leads, emails, url, verifyBeforeImport = false, duplicateCheck = { campaigns: true, lists: true, workspace: true } } = body
        const campaignId = id

        let leadsToProcess: any[] = []

        if (type === 'manual' && emails) {
            // Manual email entry - strings only
            leadsToProcess = emails.map((e: string) => ({ email: e }))
        } else if (type === 'sheets' && url) {
            // Google Sheets import
            try {
                const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
                if (!match) {
                    return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 })
                }

                const sheetId = match[1]
                const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

                let response
                if ((session as any)?.accessToken) {
                    try {
                        response = await fetch(csvUrl, {
                            headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
                        })
                    } catch (e) {
                        console.warn('Authenticated fetch failed, trying public access', e)
                    }
                }

                if (!response || !response.ok) {
                    response = await fetch(csvUrl)
                }

                if (!response.ok) {
                    return NextResponse.json({ error: 'Could not access Google Sheet. Make sure it is public OR you are logged in with access.' }, { status: 400 })
                }

                const csvText = await response.text()
                const parseResult = Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (h) => h.trim()
                })

                leadsToProcess = parseResult.data
            } catch (err) {
                console.error('Google Sheets import error:', err)
                return NextResponse.json({ error: 'Failed to import from Google Sheets' }, { status: 500 })
            }
        } else if (leads && Array.isArray(leads)) {
            // Direct leads array (pre-mapped)
            leadsToProcess = leads
        } else {
            return NextResponse.json({ error: 'Invalid import data' }, { status: 400 })
        }

        // Normalize and Deduplicate locally within the input batch
        const validCandidates: any[] = []
        const seenEmails = new Set<string>()

        for (const record of leadsToProcess) {
            let email = (record.email || '').trim()
            let firstName = record.firstName || ''
            let lastName = record.lastName || ''
            let company = record.company || record.companyName || ''
            let customFields = record.customFields

            if (!email) {
                const normalized = normalizeLead(record)
                if (normalized) {
                    email = (normalized.email || '').trim()
                    firstName = normalized.firstName || ''
                    lastName = normalized.lastName || ''
                    company = normalized.company || ''
                    customFields = normalized.customFields
                }
            }

            const lowerEmail = email.toLowerCase()
            if (lowerEmail && lowerEmail.includes('@') && !seenEmails.has(lowerEmail)) {
                seenEmails.add(lowerEmail)
                validCandidates.push({
                    email: lowerEmail,
                    firstName,
                    lastName,
                    company,
                    customFields,
                    campaignId,
                    status: 'new'
                })
            }
        }

        if (validCandidates.length === 0) {
            return NextResponse.json({ error: 'No valid email leads found in import' }, { status: 400 })
        }

        let invalidSkipped = 0
        let leadsToInsert = validCandidates

        // --- Inline In-Memory Verification (If Toggled) ---
        // Runs in server memory with 0 DB bloat and never touches verifier history
        if (verifyBeforeImport) {
            const verifiedLeads: any[] = []
            const CHUNK_SIZE = 15

            for (let i = 0; i < validCandidates.length; i += CHUNK_SIZE) {
                const chunk = validCandidates.slice(i, i + CHUNK_SIZE)
                const results = await Promise.all(
                    chunk.map(async (lead) => {
                        try {
                            const res = await verifyEmail(lead.email)
                            return { lead, isValid: res.status === 'valid' }
                        } catch {
                            return { lead, isValid: true } // Safe fallback on unexpected error
                        }
                    })
                )

                for (const r of results) {
                    if (r.isValid) {
                        verifiedLeads.push(r.lead)
                    } else {
                        invalidSkipped++
                    }
                }
            }

            leadsToInsert = verifiedLeads
        }

        if (leadsToInsert.length === 0) {
            return NextResponse.json({
                success: false,
                error: `All ${validCandidates.length} leads were invalid or disposable burner emails. 0 valid leads imported.`,
                invalidSkipped
            }, { status: 400 })
        }

        // --- Deduplication against existing leads (Campaign / Workspace scope) ---
        const candidateEmails = leadsToInsert.map(l => l.email)
        let duplicateWhere: any = { email: { in: candidateEmails }, campaignId }

        if (duplicateCheck?.workspace) {
            // Find this campaign's workspace
            const currentCampaign = await prisma.campaign.findUnique({
                where: { id: campaignId },
                include: { campaignWorkspaces: true }
            })
            const workspaceId = currentCampaign?.campaignWorkspaces?.[0]?.workspaceId

            if (workspaceId) {
                // Check across all campaigns in this workspace
                duplicateWhere = {
                    email: { in: candidateEmails },
                    campaign: {
                        campaignWorkspaces: {
                            some: { workspaceId }
                        }
                    }
                }
            }
        } else if (!duplicateCheck?.campaigns) {
            // If campaigns duplicate check is explicitly unchecked, skip DB duplicate filtering
            duplicateWhere = null
        }

        let existingEmails = new Set<string>()
        if (duplicateWhere) {
            const existingLeads = await prisma.lead.findMany({
                where: duplicateWhere,
                select: { email: true }
            })
            existingEmails = new Set(existingLeads.map(l => l.email.toLowerCase()))
        }

        const finalNewLeads = leadsToInsert.filter(l => !existingEmails.has(l.email))
        const duplicateCount = leadsToInsert.length - finalNewLeads.length

        if (finalNewLeads.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                duplicatesSkipped: duplicateCount,
                invalidSkipped,
                message: `All ${duplicateCount} leads were duplicates based on your duplicate check criteria.`
            })
        }

        // --- Persistent Lead Status Memory Cache Check ---
        // Restore historical status if this lead was previously contacted/bounced/replied
        const memoryMap = await getLeadMemoryMap(campaignId, finalNewLeads.map(l => l.email))
        let memoryRestoredCount = 0

        const leadsWithStatus = finalNewLeads.map(lead => {
            const memory = memoryMap.get(lead.email)
            if (memory && memory.status && memory.status !== 'new' && memory.status !== 'lead') {
                memoryRestoredCount++
                return {
                    ...lead,
                    status: memory.status,
                    nextSendAt: null // Never auto-send from step 1 if previously contacted
                }
            }
            return {
                ...lead,
                status: 'new'
            }
        })

        // Bulk insert in batches
        const BATCH_SIZE = 500
        const createdLeads: any[] = []

        for (let i = 0; i < leadsWithStatus.length; i += BATCH_SIZE) {
            const batch = leadsWithStatus.slice(i, i + BATCH_SIZE)

            const batchResult = await prisma.$transaction(
                batch.map(lead => prisma.lead.create({
                    data: {
                        email: lead.email,
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        company: lead.company,
                        customFields: typeof lead.customFields === 'string' ? lead.customFields : lead.customFields ? JSON.stringify(lead.customFields) : null,
                        campaignId,
                        status: lead.status,
                        nextSendAt: lead.nextSendAt !== undefined ? lead.nextSendAt : undefined
                    }
                }))
            )

            createdLeads.push(...batchResult)
        }

        const messageParts = [`Imported ${createdLeads.length} valid leads.`]
        if (duplicateCount > 0) messageParts.push(`${duplicateCount} duplicates skipped.`)
        if (invalidSkipped > 0) messageParts.push(`${invalidSkipped} invalid emails dropped.`)
        if (memoryRestoredCount > 0) messageParts.push(`${memoryRestoredCount} previously-contacted statuses restored.`)

        return NextResponse.json({
            success: true,
            count: createdLeads.length,
            duplicatesSkipped: duplicateCount,
            invalidSkipped,
            memoryRestoredCount,
            message: messageParts.join(' ')
        }, { status: 201 })

    } catch (error: any) {
        console.error('Failed to import leads:', error)
        return NextResponse.json({ error: error.message || 'Failed to import leads' }, { status: 500 })
    }
}
