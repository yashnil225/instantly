import { NextResponse } from "next/server"
import { authenticator } from "otplib"
import QRCode from "qrcode"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const APP_NAME = "Instantly Clone"

// Generate backup codes
function generateBackupCodes(count: number): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString("hex").toUpperCase()
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }
    return codes
}

// Hash backup code for storage
function hashBackupCode(code: string): string {
    const normalized = code.replace(/-/g, "").toUpperCase()
    return crypto.createHash("sha256").update(normalized).digest("hex")
}

export async function POST() {
    try {
        // In a real app, get userId from session
        const userId = "demo-user"
        const userEmail = "demo@example.com"

        // Generate secret
        const secret = authenticator.generateSecret()

        // Generate QR code
        const otpauthUrl = authenticator.keyuri(userEmail, APP_NAME, secret)
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

        // Generate backup codes
        const backupCodes = generateBackupCodes(10)
        const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code))

        // Store temporarily (not yet enabled)
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret,
                twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
                twoFactorEnabled: false // Not enabled until verified
            }
        }).catch(() => {
            // User might not exist in demo, that's ok
        })

        return NextResponse.json({
            secret,
            qrCodeDataUrl,
            backupCodes
        })
    } catch (error) {
        console.error("2FA setup failed:", error)
        return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 })
    }
}
