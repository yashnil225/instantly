import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const workspaceId = searchParams.get('workspaceId')
    const skip = (page - 1) * limit

    // Build where clause for workspace filtering
    // Accounts are linked to workspaces through campaigns -> campaignAccounts
    const whereClause = workspaceId && workspaceId !== 'all'
        ? {
            campaignAccounts: {
                some: {
                    campaign: {
                        campaignWorkspaces: {
                            some: {
                                workspaceId: workspaceId
                            }
                        }
                    }
                }
            }
        }
        : {}

    const [accounts, total] = await Promise.all([
        prisma.emailAccount.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                campaignAccounts: {
                    take: 1
                }
            }
        }),
        prisma.emailAccount.count({ where: whereClause })
    ])

    // Transform to match frontend interface
    const transformedAccounts = accounts.map(acc => ({
        id: acc.id,
        email: acc.email,
        status: acc.status as "active" | "paused" | "error" | "warmup",
        emailsSent: acc.sentToday || 0,
        emailsLimit: acc.dailyLimit || 300,
        warmupEmails: 0, // TODO: Add warmup tracking
        healthScore: acc.healthScore || 100,
        isFavorite: false, // TODO: Add favorite tracking
        hasError: acc.status === 'error',
        isWarming: false, // TODO: Add warmup status
        isDFY: false, // TODO: Add DFY tracking
        isInCampaign: acc.campaignAccounts.length > 0,
        hasCustomDomain: !!acc.provider,
        tags: [] // TODO: Add tags
    }))

    return NextResponse.json({
        accounts: transformedAccounts,
        total,
        page,
        limit
    })
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { email, firstName, lastName, provider, smtpHost, smtpPort, smtpUser, smtpPass, imapHost, imapPort, imapUser, imapPass } = body

        if (!email || !provider) {
            return NextResponse.json({ error: 'Email and provider are required' }, { status: 400 })
        }

        const existing = await prisma.emailAccount.findUnique({
            where: { email }
        })

        if (existing) {
            return NextResponse.json({ error: 'Email account already exists' }, { status: 409 })
        }

        // --- SMTP VERIFICATION ---
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort) || 587,
                secure: parseInt(smtpPort) === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            })

            await transporter.verify()
            console.log("SMTP Connection Verified")
        } catch (verifyError: any) {
            console.error("SMTP Verification Failed", verifyError)
            return NextResponse.json({ error: `Authentication failed: ${verifyError.message || 'Please verify your email and app password are correct.'}` }, { status: 400 })
        }
        // -------------------------

        const account = await prisma.emailAccount.create({
            data: {
                userId: session.user.id,
                email,
                firstName,
                lastName,
                provider,
                smtpHost,
                smtpPort: parseInt(smtpPort) || 587,
                smtpUser,
                smtpPass,
                imapHost,
                imapPort: parseInt(imapPort) || 993,
                imapUser,
                imapPass,
                status: 'active'
            }
        })

        return NextResponse.json(account)
    } catch (error) {
        console.error("Failed to create account", error)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }
}
