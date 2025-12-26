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
            select: { twoFactorSecret: true, twoFactorEnabled: true }
        }).catch(() => null)

        if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
            return NextResponse.json({ error: "2FA not enabled" }, { status: 400 })
        }

        // Verify current token
        const isValid = authenticator.verify({
            token,
            secret: user.twoFactorSecret
        })

        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: null
            }
        }).catch(() => { })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("2FA disable failed:", error)
        return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 })
    }
}
