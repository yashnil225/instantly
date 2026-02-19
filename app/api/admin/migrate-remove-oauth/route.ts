import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * Admin API to run OAuth removal migration
 * 
 * This endpoint:
 * 1. Clears all OAuth tokens (refreshToken, accessToken, expiresAt, idToken, scope) from EmailAccount
 * 2. Copies smtpPass to imapPass for accounts where imapPass is empty/null
 * 3. Sets default IMAP/SMTP settings for Gmail accounts
 * 
 * POST /api/admin/migrate-remove-oauth
 */

export async function POST(request: Request) {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optional: Check if user is admin (you may want to add admin check here)
    // For now, we allow any authenticated user to run this

    console.log('[Migrate] Starting OAuth removal migration...')
    const startTime = Date.now()
    const results = {
        tokensCleared: 0,
        imapFixed: 0,
        gmailImapDefaults: 0,
        gmailSmtpDefaults: 0,
        errorsCleared: 0,
        errors: [] as string[]
    }

    try {
        // Step 1: Clear all OAuth tokens from all accounts
        console.log('[Migrate] Step 1: Clearing OAuth tokens...')
        const tokenClearResult = await prisma.emailAccount.updateMany({
            where: {
                OR: [
                    { refreshToken: { not: null } },
                    { accessToken: { not: null } },
                    { expiresAt: { not: null } },
                    { idToken: { not: null } },
                    { scope: { not: null } }
                ]
            },
            data: {
                refreshToken: null,
                accessToken: null,
                expiresAt: null,
                idToken: null,
                scope: null
            }
        })
        results.tokensCleared = tokenClearResult.count
        console.log(`[Migrate] ✅ Cleared OAuth tokens from ${tokenClearResult.count} accounts`)

        // Step 2: Copy smtpPass to imapPass where imapPass is empty
        console.log('[Migrate] Step 2: Fixing IMAP credentials...')
        
        const accountsNeedingImapFix = await prisma.emailAccount.findMany({
            where: {
                smtpPass: { not: null },
                OR: [
                    { imapPass: null },
                    { imapPass: '' }
                ]
            },
            select: {
                id: true,
                email: true,
                smtpPass: true
            }
        })

        console.log(`[Migrate] Found ${accountsNeedingImapFix.length} accounts needing IMAP credential fix`)

        for (const account of accountsNeedingImapFix) {
            try {
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { imapPass: account.smtpPass }
                })
                results.imapFixed++
                console.log(`[Migrate] ✅ Fixed IMAP for ${account.email}`)
            } catch (err: any) {
                results.errors.push(`Failed to fix IMAP for ${account.email}: ${err.message}`)
                console.error(`[Migrate] ❌ Failed to fix IMAP for ${account.email}:`, err)
            }
        }

        // Step 3: Set default IMAP settings for Gmail accounts
        console.log('[Migrate] Step 3: Setting default IMAP settings for Gmail accounts...')
        const gmailAccountsNeedingImap = await prisma.emailAccount.findMany({
            where: {
                provider: 'google',
                OR: [
                    { imapHost: null },
                    { imapHost: '' }
                ]
            },
            select: {
                id: true,
                email: true
            }
        })

        for (const account of gmailAccountsNeedingImap) {
            try {
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: {
                        imapHost: 'imap.gmail.com',
                        imapPort: 993,
                        imapUser: account.email
                    }
                })
                results.gmailImapDefaults++
                console.log(`[Migrate] ✅ Set IMAP defaults for ${account.email}`)
            } catch (err: any) {
                results.errors.push(`Failed to set IMAP defaults for ${account.email}: ${err.message}`)
                console.error(`[Migrate] ❌ Failed to set IMAP defaults for ${account.email}:`, err)
            }
        }

        // Step 4: Set default SMTP settings for Gmail accounts
        console.log('[Migrate] Step 4: Setting default SMTP settings for Gmail accounts...')
        const gmailAccountsNeedingSmtp = await prisma.emailAccount.findMany({
            where: {
                provider: 'google',
                OR: [
                    { smtpHost: null },
                    { smtpHost: '' }
                ]
            },
            select: {
                id: true,
                email: true
            }
        })

        for (const account of gmailAccountsNeedingSmtp) {
            try {
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: {
                        smtpHost: 'smtp.gmail.com',
                        smtpPort: 587,
                        smtpUser: account.email
                    }
                })
                results.gmailSmtpDefaults++
                console.log(`[Migrate] ✅ Set SMTP defaults for ${account.email}`)
            } catch (err: any) {
                results.errors.push(`Failed to set SMTP defaults for ${account.email}: ${err.message}`)
                console.error(`[Migrate] ❌ Failed to set SMTP defaults for ${account.email}:`, err)
            }
        }

        // Step 5: Clear error states that were caused by OAuth failures
        console.log('[Migrate] Step 5: Clearing OAuth-related error states...')
        const errorClearResult = await prisma.emailAccount.updateMany({
            where: {
                status: 'error',
                errorDetail: {
                    contains: 'OAuth'
                }
            },
            data: {
                status: 'active',
                errorDetail: null
            }
        })
        results.errorsCleared = errorClearResult.count
        console.log(`[Migrate] ✅ Cleared ${errorClearResult.count} OAuth-related error states`)

        const elapsed = Date.now() - startTime
        console.log(`[Migrate] ✅ Migration completed in ${elapsed}ms`)

        return NextResponse.json({
            success: true,
            results,
            elapsedMs: elapsed,
            message: 'OAuth tokens cleared and IMAP credentials fixed. Accounts may need app passwords reconfigured.'
        })

    } catch (error: any) {
        console.error('[Migrate] ❌ Migration failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            results
        }, { status: 500 })
    }
}
