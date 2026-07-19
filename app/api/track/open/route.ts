export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
)

// Known bot/proxy User-Agent patterns that trigger false opens
// These are email provider image proxies and security scanners
const BOT_PATTERNS = [
    /GoogleImageProxy/i,
    /Mozilla\/5\.0.*Google.*Image.*Proxy/i,
    /via ggpht\.com/i,         // Gmail image proxy
    /outlook\.com/i,            // Outlook image proxy  
    /Microsoft Office/i,        // Outlook desktop
    /Outlook-iOS/i,
    /Outlook-Android/i,
    /Windows-RSS-Platform/i,
    /Barracuda/i,               // Email security scanner
    /ZmEu/i,                    // Scanner
    /Googlebot/i,
    /bingbot/i,
    /Yahoo! Slurp/i,
    /curl\//i,
    /wget\//i,
    /python-requests/i,
    /Go-http-client/i,
    /okhttp/i,
    /Apache-HttpClient/i,
    /java\//i,
]

// Minimum seconds after sending before an open can be counted as real
// Opens within this window are almost always automated pre-fetches
const MIN_OPEN_DELAY_SECONDS = 30

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eid')

    if (eventId) {
        // Find the original sent event
        const sentEvent = await prisma.sendingEvent.findUnique({
            where: { id: eventId },
            include: { lead: true, campaign: true }
        })

        if (sentEvent && sentEvent.type === 'sent') {
            try {
                // --- Filter 1: Bot/Proxy Detection ---
                // Email providers (Gmail, Outlook, Apple Mail) automatically pre-fetch
                // tracking pixels for security/caching, triggering fake opens
                const userAgent = request.headers.get('user-agent') || ''
                const isBot = BOT_PATTERNS.some(pattern => pattern.test(userAgent)) || !userAgent

                if (isBot) {
                    // Silently skip — return pixel without recording
                    return new NextResponse(PIXEL, {
                        headers: {
                            'Content-Type': 'image/gif',
                            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                        },
                    })
                }

                // --- Filter 2: Time-based filtering ---
                // If the pixel is loaded within seconds of sending, it's automated
                const secondsSinceSend = (Date.now() - new Date(sentEvent.createdAt).getTime()) / 1000
                if (secondsSinceSend < MIN_OPEN_DELAY_SECONDS) {
                    return new NextResponse(PIXEL, {
                        headers: {
                            'Content-Type': 'image/gif',
                            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                        },
                    })
                }

                // --- Filter 3: Deduplicate (one open per lead per campaign) ---
                const existingOpen = await prisma.sendingEvent.findFirst({
                    where: {
                        campaignId: sentEvent.campaignId,
                        leadId: sentEvent.leadId,
                        type: 'open'
                    }
                })

                if (!existingOpen) {
                    // Passed all filters — this is likely a real human open
                    await prisma.$transaction([
                        prisma.sendingEvent.create({
                            data: {
                                type: 'open',
                                campaignId: sentEvent.campaignId,
                                leadId: sentEvent.leadId,
                                metadata: JSON.stringify({ 
                                    originalEventId: eventId,
                                    userAgent: userAgent.substring(0, 200), // Store for debugging
                                    delaySeconds: Math.round(secondsSinceSend)
                                })
                            }
                        }),
                        prisma.campaign.update({
                            where: { id: sentEvent.campaignId },
                            data: { openCount: { increment: 1 } }
                        }),
                        prisma.campaignStat.upsert({
                            where: {
                                campaignId_date: {
                                    campaignId: sentEvent.campaignId,
                                    date: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
                                }
                            },
                            create: {
                                campaignId: sentEvent.campaignId,
                                date: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'),
                                opened: 1
                            },
                            update: {
                                opened: { increment: 1 }
                            }
                        })
                    ])
                }
            } catch (e) {
                console.error("Open tracking error", e)
            }
        }
    }

    return new NextResponse(PIXEL, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    })
}
