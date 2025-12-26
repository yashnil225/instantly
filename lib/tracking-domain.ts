/**
 * Custom Tracking Domain Configuration
 * 
 * Benefits:
 * - Better deliverability (not using main domain for tracking)
 * - Professional appearance
 * - Separate reputation for tracking links
 * 
 * Setup required:
 * 1. Add DNS CNAME record: track.yourdomain.com -> yourmainapp.com
 * 2. Configure SSL certificate for tracking domain
 * 3. Set TRACKING_DOMAIN environment variable
 */

const TRACKING_DOMAIN = process.env.TRACKING_DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000'

/**
 * Rewrite tracking links to use custom domain
 */
export function getTrackingUrl(type: 'open' | 'click', eventId: string, originalUrl?: string): string {
    const baseUrl = TRACKING_DOMAIN.replace(/\/$/, '') // Remove trailing slash

    if (type === 'open') {
        return `${baseUrl}/api/track/open?eid=${eventId}`
    }

    if (type === 'click' && originalUrl) {
        const encodedUrl = encodeURIComponent(originalUrl)
        return `${baseUrl}/api/track/click?eid=${eventId}&url=${encodedUrl}`
    }

    return baseUrl
}

/**
 * Inject tracking with custom domain
 */
export function injectTrackingWithCustomDomain(
    html: string,
    eventId: string
): string {
    let newHtml = html

    // 1. Rewrite Links
    const linkRegex = /href=["'](http[^"']+)["']/g
    newHtml = newHtml.replace(linkRegex, (match, url) => {
        const trackingUrl = getTrackingUrl('click', eventId, url)
        return `href="${trackingUrl}"`
    })

    // 2. Inject Pixel
    const pixelUrl = getTrackingUrl('open', eventId)
    const pixelImg = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`

    // Append to body
    newHtml = newHtml + pixelImg
    return newHtml
}

/**
 * Domain rotation for sending (placeholder)
 * 
 * Setup:
 * 1. Configure multiple sending domains
 * 2. Add SPF, DKIM, DMARC records for each
 * 3. Store domains in database
 */
export interface SendingDomain {
    domain: string
    active: boolean
    reputation: number // 0-100
    dailyLimit: number
    sentToday: number
}

export async function getNextSendingDomain(accountId: string): Promise<string | null> {
    // Placeholder - would query database for available domains
    // and rotate based on usage

    // TODO: Implement domain rotation logic
    // - Query SendingDomain table
    // - Filter by active and under daily limit
    // - Rotate based on least used

    return null // Falls back to account's default domain
}
