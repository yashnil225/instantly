import { NextResponse } from "next/server"
import { authenticator } from "otplib"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const { token } = await request.json()

        // In a real app, get userId from session
        const userId = "demo-user"

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true }
        }).catch(() => null)

        if (!user?.twoFactorSecret) {
            return NextResponse.json({ error: "2FA setup not initiated" }, { status: 400 })
        }

        // Verify token
        const isValid = authenticator.verify({
            token,
            secret: user.twoFactorSecret
        })

        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        }).catch(() => { })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("2FA verification failed:", error)
        return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }
}
