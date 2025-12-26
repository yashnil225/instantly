const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'demo@instantly.com'
    const password = 'password'

    console.log(`Checking user: ${email}`)
    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.error("User NOT found in database.")
        return
    }

    console.log("User found:", user.email)
    console.log("Stored Hash:", user.password)

    const match = await bcrypt.compare(password, user.password)
    console.log(`Password 'password' matches: ${match}`)

    if (!match) {
        console.log("Attempting to re-hash and update...")
        const newHash = await bcrypt.hash(password, 10)
        await prisma.user.update({
            where: { email },
            data: { password: newHash }
        })
        console.log("Password updated successfully.")
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
