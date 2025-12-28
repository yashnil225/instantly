import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/analytics/seed - Seeds sample analytics data for testing
export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const userId = session.user.id

        // Get user's campaigns
        let campaigns = await prisma.campaign.findMany({
            where: { userId },
            take: 5
        })

        // If no campaigns, create a sample one
        if (campaigns.length === 0) {
            const newCampaign = await prisma.campaign.create({
                data: {
                    name: 'Sample Campaign',
                    status: 'active',
                    userId,
                    trackOpens: true,
                    trackLinks: true
                }
            })
            campaigns = [newCampaign]
        }

        // Create sample leads if needed
        for (const campaign of campaigns) {
            const existingLeads = await prisma.lead.count({ where: { campaignId: campaign.id } })

            if (existingLeads === 0) {
                const sampleEmails = [
                    'john.smith@example.com',
                    'sarah.jones@startup.io',
                    'mike.wilson@enterprise.com',
                    'emily.brown@agency.co',
                    'david.lee@saas.io'
                ]

                for (const email of sampleEmails) {
                    await prisma.lead.create({
                        data: {
                            email,
                            firstName: email.split('.')[0],
                            lastName: email.split('.')[1]?.split('@')[0] || '',
                            company: email.split('@')[1].split('.')[0],
                            campaignId: campaign.id,
                            status: ['new', 'contacted', 'replied'][Math.floor(Math.random() * 3)]
                        }
                    })
                }
            }
        }

        // Generate sample stats for last 30 days
        const now = new Date()
        let statsCreated = 0

        for (const campaign of campaigns) {
            for (let i = 30; i >= 0; i--) {
                const date = new Date(now)
                date.setDate(date.getDate() - i)
                date.setHours(0, 0, 0, 0)

                const sent = Math.floor(Math.random() * 50) + 10
                const opened = Math.floor(sent * (0.3 + Math.random() * 0.3))
                const clicked = Math.floor(opened * (0.1 + Math.random() * 0.2))
                const replied = Math.floor(opened * (0.05 + Math.random() * 0.1))

                await prisma.campaignStat.upsert({
                    where: {
                        campaignId_date: {
                            campaignId: campaign.id,
                            date
                        }
                    },
                    update: { sent, opened, clicked, replied },
                    create: {
                        campaignId: campaign.id,
                        date,
                        sent,
                        opened,
                        clicked,
                        replied,
                        bounced: Math.floor(Math.random() * 3)
                    }
                })
                statsCreated++
            }

            // Update campaign totals
            const totals = await prisma.campaignStat.aggregate({
                where: { campaignId: campaign.id },
                _sum: { sent: true, opened: true, clicked: true, replied: true, bounced: true }
            })

            await prisma.campaign.update({
                where: { id: campaign.id },
                data: {
                    sentCount: totals._sum.sent || 0,
                    openCount: totals._sum.opened || 0,
                    clickCount: totals._sum.clicked || 0,
                    replyCount: totals._sum.replied || 0,
                    bounceCount: totals._sum.bounced || 0
                }
            })
        }

        // Create sample sending events for heatmap
        const leads = await prisma.lead.findMany({
            where: { campaign: { userId } },
            take: 20
        })

        let eventsCreated = 0
        const eventTypes = ['sent', 'open', 'click', 'reply']

        for (let i = 0; i < 200; i++) {
            const randomLead = leads[Math.floor(Math.random() * leads.length)]
            if (!randomLead) continue

            const daysAgo = Math.floor(Math.random() * 14)
            const hour = Math.floor(Math.random() * 24)
            const eventDate = new Date(now)
            eventDate.setDate(eventDate.getDate() - daysAgo)
            eventDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0)

            await prisma.sendingEvent.create({
                data: {
                    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                    leadId: randomLead.id,
                    campaignId: randomLead.campaignId,
                    createdAt: eventDate
                }
            })
            eventsCreated++
        }

        return NextResponse.json({
            success: true,
            message: 'Sample analytics data seeded',
            stats: {
                campaigns: campaigns.length,
                statsCreated,
                eventsCreated
            }
        })

    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
    }
}
