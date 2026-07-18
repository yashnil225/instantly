import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ loggedIn: false })
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ loggedIn: false })
    
    // Check if created within last 60 seconds (new user)
    const isNew = (Date.now() - new Date(user.createdAt).getTime()) < 60000
    
    return NextResponse.json({ loggedIn: true, isNew })
}
