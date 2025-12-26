import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user preferences
    let prefs = await prisma.userPreference.findUnique({
        where: { userId: session.user.id }
    })

    if (!prefs) {
        prefs = await prisma.userPreference.create({
            data: { userId: session.user.id }
        })
    }

    return NextResponse.json(prefs)
}

export async function PUT(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update or create preferences
    const prefs = await prisma.userPreference.upsert({
        where: { userId: session.user.id },
        update: {
            // Default Opportunity Value
            opportunityValue: body.opportunityValue ?? undefined,

            // Lead Preferences
            disableLeadSync: body.disableLeadSync ?? undefined,

            // AI Automations
            autoTagReplies: body.autoTagReplies ?? undefined,
            aiInboxManager: body.aiInboxManager ?? undefined,
            autoSuggestReplies: body.autoSuggestReplies ?? undefined,
            autoTagOoo: body.autoTagOoo ?? undefined,

            // Unibox
            showAutoReplies: body.showAutoReplies ?? undefined,
            saveExternalEmails: body.saveExternalEmails ?? undefined,
            saveUndelivered: body.saveUndelivered ?? undefined,
            crmNotifyOnly: body.crmNotifyOnly ?? undefined,

            // Outreach
            autoPauseBounce: body.autoPauseBounce ?? undefined,
            singleAccountGap: body.singleAccountGap ?? undefined,
            sequentialSend: body.sequentialSend ?? undefined,
            resetAzDaily: body.resetAzDaily ?? undefined,
            resetTimezone: body.resetTimezone ?? undefined,

            // Notifications
            disconnectNotify: body.disconnectNotify ?? undefined,
            positiveReplyNotify: body.positiveReplyNotify ?? undefined,
            notifyRecipients: body.notifyRecipients ?? undefined,
            audioNotify: body.audioNotify ?? undefined,

            // Language
            language: body.language ?? undefined,

            // Deliverability
            unlikelyReplyAction: body.unlikelyReplyAction ?? undefined,
            hostileAction: body.hostileAction ?? undefined,
            disableOpenTracking: body.disableOpenTracking ?? undefined,
            espMatching: body.espMatching ?? undefined,
            firstEmailText: body.firstEmailText ?? undefined,
            sisrMode: body.sisrMode ?? undefined,
            limitPerCompany: body.limitPerCompany ?? undefined,
            hasSeenWelcomeModal: body.hasSeenWelcomeModal ?? undefined,
        },
        create: {
            userId: session.user.id,
            ...body
        }
    })

    return NextResponse.json(prefs)
}
