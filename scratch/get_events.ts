import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const events = await prisma.sendingEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { lead: {select: {email: true}} }
  });
  
  for (const e of events) {
      console.log(`[${e.createdAt.toISOString()}] Type: ${e.type} | Lead: ${e.lead?.email.substr(0,15)} | id: ${e.id}`)
      if (e.details) {
          console.log(`  Details: ${e.details.substring(0, 50).replace(/\n/g, '\\n')}`)
      }
      if (e.metadata) {
          console.log(`  Meta: ${e.metadata}`)
      }
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
