import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLeadMemoryMap } from '@/lib/lead-memory'

import { canUserEditCampaign } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: campaignId } = await params

        const check = await canUserEditCampaign(session.user.id, campaignId)
        if (!check.allowed) {
            return NextResponse.json({ error: check.reason || 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { action = 'add', jobId, leads: customLeads, includeRisky = false } = body

        // Verify campaign exists
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { _count: { select: { leads: true } } }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        let leadsToProcess: Array<{
            email: string
            firstName?: string
            lastName?: string
            company?: string
            customFields?: any
        }> = []

        // 1. Fetch leads from Verification Job if jobId provided
        if (jobId) {
            const statusFilter = includeRisky ? { in: ['valid', 'risky'] } : 'valid'
            const resultItems = await prisma.verificationResultItem.findMany({
                where: {
                    jobId,
                    status: statusFilter
                },
                orderBy: { createdAt: 'asc' }
            })

            for (const item of resultItems) {
                let rowObj: Record<string, any> = {}
                try {
                    rowObj = JSON.parse(item.rowData)
                } catch {
                    rowObj = { email: item.email }
                }

                // Standard field extraction
                const email = (item.email || rowObj.email || '').trim().toLowerCase()
                if (!email || !email.includes('@')) continue

                let firstName = rowObj.firstName || rowObj.first_name || rowObj['First Name'] || rowObj['first name'] || ''
                let lastName = rowObj.lastName || rowObj.last_name || rowObj['Last Name'] || rowObj['last name'] || ''
                let company = rowObj.company || rowObj.companyName || rowObj.company_name || rowObj['Company'] || rowObj['Company Name'] || ''

                // Everything else into customFields
                const customFields: Record<string, any> = {}
                const standardKeys = new Set(['email', 'firstName', 'first_name', 'First Name', 'lastName', 'last_name', 'Last Name', 'company', 'companyName', 'Company', 'Company Name'])

                for (const [k, v] of Object.entries(rowObj)) {
                    if (!standardKeys.has(k) && v !== undefined && v !== null && String(v).trim().length > 0) {
                        customFields[k] = v
                    }
                }

                leadsToProcess.push({
                    email,
                    firstName: String(firstName || ''),
                    lastName: String(lastName || ''),
                    company: String(company || ''),
                    customFields: Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null
                })
            }
        } else if (Array.isArray(customLeads)) {
            leadsToProcess = customLeads.map((l: any) => ({
                email: (l.email || '').trim().toLowerCase(),
                firstName: l.firstName || '',
                lastName: l.lastName || '',
                company: l.company || l.companyName || '',
                customFields: l.customFields
            })).filter(l => l.email && l.email.includes('@'))
        }

        if (leadsToProcess.length === 0) {
            return NextResponse.json({ error: 'No valid leads found to import' }, { status: 400 })
        }

        // Deduplicate locally within the input list
        const uniqueCandidates: typeof leadsToProcess = []
        const seen = new Set<string>()
        for (const l of leadsToProcess) {
            if (!seen.has(l.email)) {
                seen.add(l.email)
                uniqueCandidates.push(l)
            }
        }

        let replacedCount = 0

        // 2. If 'replace' action requested:
        // Delete only uncontacted/unverified 'new' and 'lead' status leads in this campaign.
        // Any leads already contacted/sent/replied/bounced are preserved safely.
        if (action === 'replace') {
            const deletedUncontacted = await prisma.lead.deleteMany({
                where: {
                    campaignId,
                    status: { in: ['new', 'lead'] }
                }
            })
            replacedCount = deletedUncontacted.count
        }

        // 3. Deduplicate against leads currently remaining in the campaign
        const existingLeads = await prisma.lead.findMany({
            where: {
                campaignId,
                email: { in: uniqueCandidates.map(l => l.email) }
            },
            select: { email: true }
        })
        const existingEmails = new Set(existingLeads.map(l => l.email.toLowerCase()))

        const finalLeadsToInsert = uniqueCandidates.filter(l => !existingEmails.has(l.email))
        const duplicatesSkipped = uniqueCandidates.length - finalLeadsToInsert.length

        if (finalLeadsToInsert.length === 0) {
            return NextResponse.json({
                success: true,
                importedCount: 0,
                duplicatesSkipped,
                replacedCount,
                message: `All ${duplicatesSkipped} leads were already present in the campaign.`
            })
        }

        // 4. Check LeadStatusMemory Cache to restore historical status for previously contacted leads
        const memoryMap = await getLeadMemoryMap(campaignId, finalLeadsToInsert.map(l => l.email))
        let memoryRestoredCount = 0

        const leadsWithStatus = finalLeadsToInsert.map(lead => {
            const memory = memoryMap.get(lead.email)
            if (memory && memory.status && memory.status !== 'new' && memory.status !== 'lead') {
                memoryRestoredCount++
                return {
                    ...lead,
                    status: memory.status,
                    nextSendAt: null
                }
            }
            return {
                ...lead,
                status: 'new',
                nextSendAt: null
            }
        })

        // 5. Bulk insert in batches with createMany (Zero RAM accumulation)
        const BATCH_SIZE = 500
        let totalInserted = 0

        for (let i = 0; i < leadsWithStatus.length; i += BATCH_SIZE) {
            const batch = leadsWithStatus.slice(i, i + BATCH_SIZE)
            const result = await prisma.lead.createMany({
                data: batch.map(lead => ({
                    email: lead.email,
                    firstName: lead.firstName || '',
                    lastName: lead.lastName || '',
                    company: lead.company || '',
                    customFields: lead.customFields || null,
                    campaignId,
                    status: lead.status,
                    nextSendAt: lead.nextSendAt !== undefined ? lead.nextSendAt : undefined
                }))
            })
            totalInserted += result.count
        }

        const messageParts = [`Successfully ${action === 'replace' ? 'replaced & ' : ''}added ${totalInserted} valid leads into "${campaign.name}".`]
        if (duplicatesSkipped > 0) messageParts.push(`${duplicatesSkipped} duplicates skipped.`)
        if (replacedCount > 0) messageParts.push(`${replacedCount} unverified leads replaced.`)
        if (memoryRestoredCount > 0) messageParts.push(`${memoryRestoredCount} previously-contacted lead statuses restored.`)

        return NextResponse.json({
            success: true,
            importedCount: totalInserted,
            duplicatesSkipped,
            replacedCount,
            memoryRestoredCount,
            campaignName: campaign.name,
            message: messageParts.join(' ')
        })

    } catch (error: any) {
        console.error('Failed to replace/add leads to campaign:', error)
        return NextResponse.json({ error: error.message || 'Failed to add leads to campaign' }, { status: 500 })
    }
}
