
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Email Account Errors ---')
    const accountsWithError = await prisma.emailAccount.findMany({
        where: { status: 'error' },
        select: { email: true, errorDetail: true }
    })
    console.log(JSON.stringify(accountsWithError, null, 2))

    console.log('\n--- Failed Scheduled Emails ---')
    const failedEmails = await prisma.scheduledEmail.findMany({
        where: { status: 'failed' },
        take: 10
    })
    console.log(JSON.stringify(failedEmails, null, 2))

    console.log('\n--- Audit Logs (last 10) ---')
    const logs = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    })
    console.log(JSON.stringify(logs, null, 2))

    console.log('\n--- Warmup Logs (last 10) ---')
    const warmupLogs = await prisma.warmupLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    })
    console.log(JSON.stringify(warmupLogs, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
