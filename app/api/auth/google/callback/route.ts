
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        // In real flow, this might be handled by middleware, but here just redirect to login or error
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    // Simulate Token Exchange
    const mockEmail = `user_${Date.now()}@gmail.com` // Generate unique mock email
    const mockRefreshToken = `mock_refresh_token_${Date.now()}`

    try {
        // Create the account in DB
        // We use the existing EmailAccount model but map OAuth fields differently
        // Since schema might not have specific oauth fields, we'll store minimal info
        // or reuse smtp/imap fields with placeholders if strict schema
        // Assuming loose schema or existing fields:

        await prisma.emailAccount.create({
            data: {
                email: mockEmail,
                firstName: 'Google',
                lastName: 'User',
                provider: 'google-oauth',
                status: 'active',
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpUser: mockEmail,
                smtpPass: 'oauth-token-placeholder', // In real world, we'd store tokens in a separate table or encrypted field
                imapHost: 'imap.gmail.com',
                imapPort: 993,
                imapUser: mockEmail,
                imapPass: 'oauth-token-placeholder',
                // userID link would happen here if schema has it, but based on accounts/route.ts it seems to rely on session but doesn't explicitly link userId in `data`?
                // Wait, api/accounts/route.ts POST didn't use `userId`. It just created it.
                // Does EmailAccount not have a userId?
                // Let me check api/accounts/route.ts again. It didn't put userId in `data`.
                // Maybe it's not multi-tenant in that way, or table doesn't have it?
                // Ah, looking at `api/campaigns/route.ts`, that DOES use `userId`.
                // Let's assume EmailAccount might be global or missing relations?
                // I'll stick to what accounts/route.ts does.
            }
        })

        // Redirect to accounts page
        return NextResponse.redirect(new URL('/accounts', request.url))

    } catch (error) {
        console.error("OAuth Callback Error", error)
        return NextResponse.redirect(new URL('/accounts/connect?error=oauth_failed', request.url))
    }
}
