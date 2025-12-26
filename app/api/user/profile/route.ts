import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, password } = body

        const updateData: any = { name }

        if (password && password.trim() !== '') {
            const bcrypt = require('bcryptjs')
            const hashedPassword = await bcrypt.hash(password, 10)
            updateData.password = hashedPassword
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Failed to update profile:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
