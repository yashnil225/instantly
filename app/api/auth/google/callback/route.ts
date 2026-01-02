
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/campaigns?error=unauthorized', request.url))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL(`/campaigns?error=${error}`, request.url))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/campaigns?error=no_code', request.url))
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
        )

        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        // Get user info to identify this account
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
        const { data: userInfo } = await oauth2.userinfo.get()

        if (!userInfo.email) {
            throw new Error('No email found in Google profile')
        }

        // Upsert EmailAccount
        await prisma.emailAccount.upsert({
            where: {
                email: userInfo.email
            },
            create: {
                userId: session.user.id,
                email: userInfo.email,
                firstName: userInfo.given_name,
                lastName: userInfo.family_name,
                provider: 'google',
                refreshToken: tokens.refresh_token,
                accessToken: tokens.access_token,
                expiresAt: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
                idToken: tokens.id_token,
                scope: tokens.scope
            },
            update: {
                userId: session.user.id, // Re-claim if needed
                provider: 'google',
                refreshToken: tokens.refresh_token, // Update if we got a new one
                accessToken: tokens.access_token,
                expiresAt: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
                scope: tokens.scope,
                status: 'active'
            }
        })

        return NextResponse.redirect(new URL('/campaigns/accounts?success=connected', request.url))

    } catch (error: any) {
        console.error('Google Connect Error:', error)
        
        // Detect specific error types for better user feedback
        let errorType = 'connect_failed'
        if (error?.message?.includes('invalid_grant') || error?.code === 400) {
            errorType = 'token_expired'
        } else if (error?.message?.includes('No email')) {
            errorType = 'no_email'
        } else if (error?.code === 401) {
            errorType = 'unauthorized'
        }
        
        return NextResponse.redirect(new URL(`/campaigns/accounts?error=${errorType}`, request.url))
    }
}
