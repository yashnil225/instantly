const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const events = await prisma.sendingEvent.findMany({
        where: { type: 'sent' },
        orderBy: { createdAt: 'asc' }
    })
    console.log(JSON.stringify(events.map(e => ({ id: e.id, type: e.type, createdAt: e.createdAt, meta: e.metadata })), null, 2))
}
main()
