
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { google } from 'googleapis'

export async function GET(request: Request) {
    const session = await auth()

    // Ensure user is authenticated
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const callbackUrl = searchParams.get('callbackUrl') || '/campaigns/accounts'

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
    )

    // Generate auth URL
    // access_type: 'offline' provides a refresh token
    // prompt: 'consent' forces a new refresh token even if previously authorized
    const scopes = [
        'https://mail.google.com/', // Full access to send/read emails
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state: callbackUrl // Pass the callback URL via state
    })

    return NextResponse.json({ url })
}
