import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Create default "My Organization" workspace
    const myOrganization = await prisma.workspace.upsert({
        where: { id: 'default-workspace' },
        update: {},
        create: {
            id: 'default-workspace',
            name: 'My Organization',
            description: 'Default workspace showing all campaigns',
            isDefault: true
        }
    })

    console.log('Created default workspace:', myOrganization.name)
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
