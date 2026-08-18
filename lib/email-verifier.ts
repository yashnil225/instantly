import dns from 'dns'
import net from 'net'
import axios from 'axios'

export interface VerificationResult {
    email: string
    status: 'valid' | 'risky' | 'invalid' | 'disposable'
    reason: string
    score: number // 0 to 100
    isSyntaxValid: boolean
    isDisposable: boolean
    isRoleBased: boolean
    isFreeProvider: boolean
    hasMx: boolean
    mxHost?: string
    isCatchAll?: boolean
    suggestedFix?: string
    checkedAt: string
}

// In-memory DNS MX cache for batch speed & zero latency
const mxCache = new Map<string, { mxRecords: dns.MxRecord[]; timestamp: number }>()
const MX_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// 1. Common Typo Map
const TYPO_MAP: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yaho.co': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'iclud.com': 'icloud.com'
}

// 2. Free Webmail Providers
const FREE_PROVIDERS = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.in',
    'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'zoho.com', 'protonmail.com',
    'proton.me', 'mail.com', 'gmx.com', 'gmx.net', 'yandex.com', 'yandex.ru'
])

// 3. Role-Based Prefixes
const ROLE_PREFIXES = new Set([
    'admin', 'administrator', 'support', 'help', 'info', 'billing', 'accounts',
    'payments', 'sales', 'contact', 'office', 'jobs', 'careers', 'press',
    'media', 'legal', 'compliance', 'security', 'abuse', 'postmaster', 'hostmaster',
    'marketing', 'team', 'hr', 'operations', 'no-reply', 'noreply', 'donotreply'
])

// 4. Curated disposable burner domains
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.net',
    'guerrillamail.org', 'sharklasers.com', 'tempmail.com', 'temp-mail.org', 'tempmail.net',
    'throwawaymail.com', 'fakeinbox.com', 'getairmail.com', 'dispostable.com', 'yopmail.com',
    'yopmail.fr', 'yopmail.net', 'trashmail.com', 'trashmail.net', 'trashmail.org',
    'nada.ltd', 'inboxkitten.com', 'crazymailing.com', 'mytemp.email', 'dropmail.me',
    'mohmal.com', 'burnermail.io', 'generator.email', 'tempail.com', 'tempinbox.com',
    'emailondeck.com', 'maildrop.cc', 'harakirimail.com', 'tmailor.com', 'fakemailgenerator.com',
    'internxt.com', 'minuteinbox.com', 'luxusmail.org', 'brefmail.com', 'guerrillamailblock.com',
    'grr.la', 'spam4.me', 'pokemail.net', 'mailnesia.com', 'jetable.org', 'meltmail.com',
    'incognitomail.org', 'safetymail.info', 'spambox.us', 'temp-mail.io', 'crazymailing.net',
    'trashmail.me', 'trashmail.at', 'trashmail.io', 'hidemail.de', 'wegwerfmail.de',
    'spamavert.com', 'tempsky.com', 'e4ward.com', 'sneakemail.com', 'mytempemail.com',
    'boun.cr', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'fleckens.hu', 'gustr.com',
    'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'einrot.com'
])

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/**
 * Fast DNS MX resolution with caching
 */
async function getDomainMx(domain: string): Promise<dns.MxRecord[]> {
    const cached = mxCache.get(domain)
    if (cached && (Date.now() - cached.timestamp < MX_CACHE_TTL)) {
        return cached.mxRecords
    }

    try {
        const resolveMxPromise = dns.promises.resolveMx(domain)
        const timeoutPromise = new Promise<dns.MxRecord[]>((_, reject) =>
            setTimeout(() => reject(new Error('DNS timeout')), 1200)
        )
        const records = await Promise.race([resolveMxPromise, timeoutPromise])
        records.sort((a, b) => a.priority - b.priority)
        mxCache.set(domain, { mxRecords: records, timestamp: Date.now() })
        return records
    } catch {
        try {
            const resolveAPromise = dns.promises.resolve4(domain)
            const aTimeout = new Promise<string[]>((_, reject) =>
                setTimeout(() => reject(new Error('DNS timeout')), 800)
            )
            const aRecords = await Promise.race([resolveAPromise, aTimeout])
            if (aRecords.length > 0) {
                const fallbackMx = [{ exchange: domain, priority: 10 }]
                mxCache.set(domain, { mxRecords: fallbackMx, timestamp: Date.now() })
                return fallbackMx
            }
        } catch {}
        return []
    }
}

/**
 * Direct HTTPS mailbox existence probe for Microsoft 365 / Office 365 / Outlook (Port 443)
 */
async function probeMicrosoftMailbox(email: string): Promise<{ checked: boolean; exists?: boolean; reason?: string }> {
    try {
        const res = await axios.post(
            'https://login.microsoftonline.com/common/GetCredentialType',
            { username: email, isSignup: false },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                timeout: 1800
            }
        )

        const ifExistsResult = res.data?.IfExistsResult
        // 0 = User exists
        // 1 = User does not exist
        // 5 = Federation / Custom SSO
        // 6 = Domain not found in tenant
        if (ifExistsResult === 0) {
            return { checked: true, exists: true, reason: 'Active mailbox confirmed on Microsoft 365' }
        } else if (ifExistsResult === 1) {
            return { checked: true, exists: false, reason: 'Mailbox does not exist on Microsoft 365 (User Not Found)' }
        }
    } catch {}
    return { checked: false }
}

/**
 * Direct HTTPS probe for Google Workspace / Gmail (Port 443)
 */
async function probeGoogleMailbox(email: string): Promise<{ checked: boolean; exists?: boolean; reason?: string }> {
    try {
        const res = await axios.get(
            `https://mail.google.com/mail/gxlu?email=${encodeURIComponent(email)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 1800,
                maxRedirects: 0,
                validateStatus: () => true
            }
        )

        // If Google returns Set-Cookie with COMPASS token, account is registered
        const cookies = res.headers['set-cookie'] || []
        const hasCompass = cookies.some(c => c.includes('COMPASS='))
        if (hasCompass) {
            return { checked: true, exists: true, reason: 'Active account confirmed on Google Workspace' }
        }
    } catch {}
    return { checked: false }
}

/**
 * Multi-layer email verification engine with direct HTTPS Provider Probes
 */
export async function verifyEmail(emailInput: string): Promise<VerificationResult> {
    const email = (emailInput || '').trim()
    const now = new Date().toISOString()

    // --- Step 1: Syntax Validation ---
    if (!email || !EMAIL_REGEX.test(email)) {
        return {
            email,
            status: 'invalid',
            reason: 'Invalid email syntax',
            score: 0,
            isSyntaxValid: false,
            isDisposable: false,
            isRoleBased: false,
            isFreeProvider: false,
            hasMx: false,
            checkedAt: now
        }
    }

    const [localPart, domainPart] = email.split('@')
    const local = localPart.toLowerCase()
    const domain = domainPart.toLowerCase()

    // Typo suggestion
    const suggestedFix = TYPO_MAP[domain] ? `${localPart}@${TYPO_MAP[domain]}` : undefined

    // --- Step 2: Disposable Check ---
    const isDisposable = DISPOSABLE_DOMAINS.has(domain) || domain.includes('tempmail') || domain.includes('throwaway') || domain.includes('disposable')
    if (isDisposable) {
        return {
            email,
            status: 'disposable',
            reason: 'Disposable temporary email domain',
            score: 0,
            isSyntaxValid: true,
            isDisposable: true,
            isRoleBased: false,
            isFreeProvider: false,
            hasMx: false,
            suggestedFix,
            checkedAt: now
        }
    }

    const isRoleBased = ROLE_PREFIXES.has(local)
    const isFreeProvider = FREE_PROVIDERS.has(domain)

    // --- Step 3: Fast Cached DNS MX Lookup ---
    const mxRecords = await getDomainMx(domain)

    if (mxRecords.length === 0) {
        return {
            email,
            status: 'invalid',
            reason: 'Domain has no active MX records to receive email',
            score: 0,
            isSyntaxValid: true,
            isDisposable: false,
            isRoleBased,
            isFreeProvider,
            hasMx: false,
            suggestedFix,
            checkedAt: now
        }
    }

    const primaryMx = mxRecords[0].exchange.toLowerCase()

    // --- Step 4: Direct HTTPS Provider Mailbox Probing (Zero Blocked Ports) ---
    // A. Microsoft 365 / Outlook Probe
    if (primaryMx.includes('outlook.com') || primaryMx.includes('protection.outlook.com') || domain === 'hotmail.com' || domain === 'outlook.com') {
        const msProbe = await probeMicrosoftMailbox(email)
        if (msProbe.checked) {
            if (msProbe.exists === true) {
                return {
                    email,
                    status: isRoleBased ? 'risky' : 'valid',
                    reason: isRoleBased ? 'Role-based email on Microsoft 365' : 'Mailbox active & verified on Microsoft 365',
                    score: isRoleBased ? 80 : 99,
                    isSyntaxValid: true,
                    isDisposable: false,
                    isRoleBased,
                    isFreeProvider,
                    hasMx: true,
                    mxHost: primaryMx,
                    suggestedFix,
                    checkedAt: now
                }
            } else if (msProbe.exists === false) {
                return {
                    email,
                    status: 'invalid',
                    reason: 'Mailbox does not exist on Microsoft 365 (User Not Found)',
                    score: 0,
                    isSyntaxValid: true,
                    isDisposable: false,
                    isRoleBased,
                    isFreeProvider,
                    hasMx: true,
                    mxHost: primaryMx,
                    suggestedFix,
                    checkedAt: now
                }
            }
        }
    }

    // B. Google Workspace / Gmail Probe
    if (primaryMx.includes('google.com') || primaryMx.includes('googlemail.com') || domain === 'gmail.com') {
        const gProbe = await probeGoogleMailbox(email)
        if (gProbe.checked && gProbe.exists === true) {
            return {
                email,
                status: isRoleBased ? 'risky' : 'valid',
                reason: isRoleBased ? 'Role-based email on Google Workspace' : 'Mailbox active & verified on Google Workspace',
                score: isRoleBased ? 80 : 99,
                isSyntaxValid: true,
                isDisposable: false,
                isRoleBased,
                isFreeProvider,
                hasMx: true,
                mxHost: primaryMx,
                suggestedFix,
                checkedAt: now
            }
        }
    }

    // --- Step 5: General MX Deliverability ---
    return {
        email,
        status: isRoleBased ? 'risky' : 'valid',
        reason: isRoleBased ? 'Role-based email address (e.g. info@, sales@)' : 'Valid syntax & active mail exchange servers verified',
        score: isRoleBased ? 75 : 92,
        isSyntaxValid: true,
        isDisposable: false,
        isRoleBased,
        isFreeProvider,
        hasMx: true,
        mxHost: primaryMx,
        suggestedFix,
        checkedAt: now
    }
}
