import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database with sample data...')

    // Create demo user if doesn't exist
    const hashedPassword = await bcrypt.hash('demo123', 10)
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@instantly.ai' },
        update: {},
        create: {
            email: 'demo@instantly.ai',
            name: 'Demo User',
            password: hashedPassword,
            plan: 'growth'
        }
    })
    console.log('✅ Created demo user:', demoUser.email)

    // Create default "My Organization" workspace
    const myOrganization = await prisma.workspace.upsert({
        where: { id: 'default-workspace' },
        update: { userId: demoUser.id },
        create: {
            id: 'default-workspace',
            name: 'My Organization',
            description: 'Default workspace showing all campaigns',
            isDefault: true,
            userId: demoUser.id,
            opportunityValue: 5000
        }
    })
    console.log('✅ Created default workspace:', myOrganization.name)

    // Create sample campaigns
    const campaigns = []
    const campaignNames = [
        'Q4 Enterprise Outreach',
        'SaaS Decision Makers',
        'Startup Founders Outreach',
        'Agency Leads Campaign'
    ]

    for (const name of campaignNames) {
        const campaign = await prisma.campaign.upsert({
            where: { id: `sample-${name.toLowerCase().replace(/\s+/g, '-')}` },
            update: {},
            create: {
                id: `sample-${name.toLowerCase().replace(/\s+/g, '-')}`,
                name,
                status: 'active',
                userId: demoUser.id,
                trackOpens: true,
                trackLinks: true,
                sentCount: Math.floor(Math.random() * 500) + 100,
                openCount: Math.floor(Math.random() * 200) + 50,
                clickCount: Math.floor(Math.random() * 50) + 10,
                replyCount: Math.floor(Math.random() * 30) + 5,
            }
        })
        campaigns.push(campaign)

        // Link campaign to workspace
        await prisma.campaignWorkspace.upsert({
            where: {
                campaignId_workspaceId: {
                    campaignId: campaign.id,
                    workspaceId: myOrganization.id
                }
            },
            update: {},
            create: {
                campaignId: campaign.id,
                workspaceId: myOrganization.id
            }
        })
    }
    console.log('✅ Created sample campaigns:', campaigns.length)

    // Create sample leads for each campaign
    const sampleLeads = [
        { email: 'john@example.com', firstName: 'John', lastName: 'Smith', company: 'Acme Corp' },
        { email: 'sarah@startup.io', firstName: 'Sarah', lastName: 'Johnson', company: 'Startup Inc' },
        { email: 'mike@enterprise.com', firstName: 'Mike', lastName: 'Williams', company: 'Enterprise Co' },
        { email: 'emily@agency.co', firstName: 'Emily', lastName: 'Brown', company: 'Digital Agency' },
        { email: 'david@saas.io', firstName: 'David', lastName: 'Davis', company: 'SaaS Platform' },
    ]

    for (const campaign of campaigns) {
        for (const leadData of sampleLeads) {
            const leadId = `lead-${campaign.id}-${leadData.email.replace('@', '-')}`
            await prisma.lead.upsert({
                where: { id: leadId },
                update: {},
                create: {
                    id: leadId,
                    ...leadData,
                    campaignId: campaign.id,
                    status: ['new', 'contacted', 'replied'][Math.floor(Math.random() * 3)]
                }
            })
        }
    }
    console.log('✅ Created sample leads')

    // Create sample campaign stats for the last 30 days
    const now = new Date()
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
        }
    }
    console.log('✅ Created campaign stats for last 30 days')

    // Create sample sending events for heatmap
    const eventTypes = ['sent', 'open', 'click', 'reply']
    const leads = await prisma.lead.findMany({ take: 20 })

    for (let i = 0; i < 500; i++) {
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
    }
    console.log('✅ Created 500 sample sending events for heatmap')

    console.log('\n🎉 Database seeding complete!')
    console.log('\n📧 Demo credentials:')
    console.log('   Email: demo@instantly.ai')
    console.log('   Password: demo123')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
