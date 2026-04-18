import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const steps = await prisma.campaignStep.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  
  if (steps.length === 0) {
      console.log('No steps found')
      return
  }
  
  console.log("Found steps. First one variants:")
  // @ts-ignore
  if (steps[0].variants) {
      // @ts-ignore
      console.log(steps[0].variants.map(v => v.body))
  } else {
      console.log(steps[0].body)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
