/**
 * Two-Factor Authentication (2FA)
 * TOTP-based 2FA with backup codes
 */

import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { prisma } from './prisma'

const APP_NAME = "Instantly Clone"

export interface TwoFactorSetup {
    secret: string
    qrCodeDataUrl: string
    backupCodes: string[]
}

export interface TwoFactorVerifyResult {
    success: boolean
    error?: string
    usedBackupCode?: boolean
}

/**
 * Generate 2FA setup for a user
 */
export async function generateTwoFactorSetup(userId: string, email: string): Promise<TwoFactorSetup> {
    // Generate secret
    const secret = authenticator.generateSecret()

    // Generate QR code
    const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret)
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

    // Generate backup codes
    const backupCodes = generateBackupCodes(10)

    // Store temporarily (not yet enabled)
    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorSecret: secret,
            twoFactorBackupCodes: JSON.stringify(backupCodes.map(code => hashBackupCode(code))),
            twoFactorEnabled: false // Not enabled until verified
        }
    })

    return {
        secret,
        qrCodeDataUrl,
        backupCodes
    }
}

/**
 * Enable 2FA after successful verification
 */
export async function enableTwoFactor(userId: string, token: string): Promise<TwoFactorVerifyResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true }
    })

    if (!user?.twoFactorSecret) {
        return { success: false, error: "2FA setup not initiated" }
    }

    const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret
    })

    if (!isValid) {
        return { success: false, error: "Invalid verification code" }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
    })

    return { success: true }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactor(userId: string, token: string): Promise<TwoFactorVerifyResult> {
    // Verify current token before disabling
    const result = await verifyTwoFactorToken(userId, token)

    if (!result.success) {
        return result
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: null
        }
    })

    return { success: true }
}

/**
 * Verify 2FA token during login
 */
export async function verifyTwoFactorToken(userId: string, token: string): Promise<TwoFactorVerifyResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            twoFactorSecret: true,
            twoFactorEnabled: true,
            twoFactorBackupCodes: true
        }
    })

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false, error: "2FA not enabled" }
    }

    // Try regular TOTP token first
    const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret
    })

    if (isValid) {
        return { success: true }
    }

    // Try backup codes
    if (user.twoFactorBackupCodes) {
        const hashedToken = hashBackupCode(token)
        const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes)

        const codeIndex = backupCodes.indexOf(hashedToken)
        if (codeIndex !== -1) {
            // Remove used backup code
            backupCodes.splice(codeIndex, 1)
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorBackupCodes: JSON.stringify(backupCodes) }
            })

            return { success: true, usedBackupCode: true }
        }
    }

    return { success: false, error: "Invalid verification code" }
}

/**
 * Check if user has 2FA enabled
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true }
    })
    return user?.twoFactorEnabled || false
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string, token: string): Promise<{ success: boolean; codes?: string[]; error?: string }> {
    // Verify current token
    const result = await verifyTwoFactorToken(userId, token)

    if (!result.success) {
        return { success: false, error: result.error }
    }

    const newCodes = generateBackupCodes(10)

    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorBackupCodes: JSON.stringify(newCodes.map(code => hashBackupCode(code)))
        }
    })

    return { success: true, codes: newCodes }
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorBackupCodes: true }
    })

    if (!user?.twoFactorBackupCodes) return 0

    const codes: string[] = JSON.parse(user.twoFactorBackupCodes)
    return codes.length
}

/**
 * Generate random backup codes
 */
function generateBackupCodes(count: number): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = crypto.randomBytes(4).toString('hex').toUpperCase()
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }
    return codes
}

/**
 * Hash a backup code for secure storage
 */
function hashBackupCode(code: string): string {
    // Remove dashes and lowercase for comparison
    const normalized = code.replace(/-/g, '').toUpperCase()
    return crypto.createHash('sha256').update(normalized).digest('hex')
}

/**
 * Remember device for 2FA (30 days)
 */
export async function rememberDevice(userId: string, deviceId: string): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.trustedDevice.upsert({
        where: {
            userId_deviceId: { userId, deviceId }
        },
        create: {
            userId,
            deviceId,
            expiresAt
        },
        update: {
            expiresAt
        }
    })
}

/**
 * Check if device is trusted
 */
export async function isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    const device = await prisma.trustedDevice.findUnique({
        where: {
            userId_deviceId: { userId, deviceId }
        }
    })

    if (!device) return false
    if (device.expiresAt < new Date()) {
        // Expired, delete it
        await prisma.trustedDevice.delete({
            where: { userId_deviceId: { userId, deviceId } }
        })
        return false
    }

    return true
}

/**
 * Remove trusted device
 */
export async function removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    await prisma.trustedDevice.delete({
        where: { userId_deviceId: { userId, deviceId } }
    }).catch(() => { })
}

/**
 * Get all trusted devices for a user
 */
export async function getTrustedDevices(userId: string): Promise<{ deviceId: string; expiresAt: Date }[]> {
    const devices = await prisma.trustedDevice.findMany({
        where: {
            userId,
            expiresAt: { gt: new Date() }
        },
        select: { deviceId: true, expiresAt: true }
    })
    return devices
}
