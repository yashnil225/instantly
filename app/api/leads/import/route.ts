
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLeadMemoryMap } from '@/lib/lead-memory'

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { campaignId, leads, source } = body

        if (!campaignId || !leads || !Array.isArray(leads)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const userId = session.user.id

        // Verify Workspace/Campaign Access
        // We check if the user has access to the campaign's workspace
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                campaignWorkspaces: {
                    some: {
                        workspace: {
                            OR: [
                                { userId: userId }, // Owner
                                { members: { some: { userId: userId } } } // Member
                            ]
                        }
                    }
                }
            }
        })

        // Also allow if user is direct owner of campaign (legacy support)
        const directCampaign = await prisma.campaign.findFirst({
            where: { id: campaignId, userId }
        })

        if (!campaign && !directCampaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 403 })
        }

        // Prepare data for bulk insert
        let successCount = 0
        let errorCount = 0

        // Prisma createMany is faster but doesn't handle duplicates gracefully with SQLite sometimes or if unique constraints conflict differently.
        // Assuming 'email' + 'campaignId' is unique.
        // We'll use a transaction with upsert or ignore.
        // Actually, createMany with skipDuplicates is best if supported by DB.
        // Let's iterate for safety and updates.

        const candidateEmails = leads.map((l: any) => (l.email || '').trim().toLowerCase()).filter(Boolean)
        const memoryMap = await getLeadMemoryMap(campaignId, candidateEmails)

        const operations = leads.map((lead: any) => {
            const rawEmail = (lead.email || '').trim().toLowerCase()
            // Validate email
            if (!rawEmail || !rawEmail.includes('@')) {
                errorCount++
                return null
            }

            const memory = memoryMap.get(rawEmail)
            const initialStatus = memory?.status && memory.status !== 'new' ? memory.status : 'new'

            return prisma.lead.upsert({
                where: {
                    email_campaignId: {
                        email: rawEmail,
                        campaignId: campaignId
                    }
                },
                update: {
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    company: lead.companyName || lead.company,
                    website: lead.website,
                    phone: lead.phone,
                    // If this lead was previously contacted in this campaign, preserve that state
                    ...(memory?.status ? { status: memory.status } : {})
                },
                create: {
                    email: rawEmail,
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    company: lead.companyName || lead.company,
                    website: lead.website,
                    phone: lead.phone,
                    campaignId: campaignId,
                    status: initialStatus
                }
            })
        }).filter(Boolean) as any[]

        if (operations.length > 0) {
            await prisma.$transaction(operations)
            successCount = operations.length
        }

        return NextResponse.json({
            success: true,
            imported: successCount,
            failed: errorCount // (Validation fails)
        })

    } catch (error) {
        console.error('Import failed:', error)
        return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 })
    }
}
