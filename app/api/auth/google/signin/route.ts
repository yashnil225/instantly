
import { NextResponse } from 'next/server'
import { auth } from '@/auth' // Mock auth if not real
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    // Simulates "Sign in with Google"
    // Redirects to the callback with a mock code
    const mockCode = 'mock_google_oauth_code_123'
    const callbackUrl = new URL('/api/auth/google/callback', request.url)
    callbackUrl.searchParams.set('code', mockCode)

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800))

    return NextResponse.redirect(callbackUrl)
}
