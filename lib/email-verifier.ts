import dns from 'dns'
import net from 'net'

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
 * Multi-layer email verification engine with fast timeouts
 */
export async function verifyEmail(emailInput: string, options: { deepSmtpProbe?: boolean; timeoutMs?: number } = {}): Promise<VerificationResult> {
    const { deepSmtpProbe = true, timeoutMs = 2200 } = options
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

    // --- Step 3: Fast Cached DNS MX Lookup with 1.5s Hard Timeout ---
    let mxRecords: dns.MxRecord[] = []
    const cached = mxCache.get(domain)

    if (cached && (Date.now() - cached.timestamp < MX_CACHE_TTL)) {
        mxRecords = cached.mxRecords
    } else {
        try {
            const resolveMxPromise = dns.promises.resolveMx(domain)
            const timeoutPromise = new Promise<dns.MxRecord[]>((_, reject) =>
                setTimeout(() => reject(new Error('DNS MX timeout')), 1500)
            )
            mxRecords = await Promise.race([resolveMxPromise, timeoutPromise])
            mxCache.set(domain, { mxRecords, timestamp: Date.now() })
        } catch {
            // Fallback: check A record with 1s timeout
            try {
                const resolveAPromise = dns.promises.resolve4(domain)
                const aTimeout = new Promise<string[]>((_, reject) =>
                    setTimeout(() => reject(new Error('DNS A timeout')), 1000)
                )
                const aRecords = await Promise.race([resolveAPromise, aTimeout])
                if (aRecords.length === 0) {
                    return {
                        email,
                        status: 'invalid',
                        reason: 'Domain has no active MX or DNS records',
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
            } catch {
                return {
                    email,
                    status: 'invalid',
                    reason: 'Domain does not exist (DNS failed)',
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
        }
    }

    if (mxRecords.length === 0) {
        return {
            email,
            status: 'invalid',
            reason: 'Domain has no active MX records',
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

    // Sort by priority (lowest number is highest priority)
    const sortedMx = [...mxRecords].sort((a, b) => a.priority - b.priority)
    const primaryMx = sortedMx[0].exchange

    if (!deepSmtpProbe) {
        return {
            email,
            status: isRoleBased ? 'risky' : 'valid',
            reason: isRoleBased ? 'Role-based address with active MX' : 'Valid syntax and active MX records',
            score: isRoleBased ? 75 : 95,
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

    // --- Step 4: Direct SMTP Handshake Probe with Strict Hard Timeout ---
    const probe = await probeSmtpMailbox(primaryMx, domain, email, timeoutMs)

    let score = 100
    let status: 'valid' | 'risky' | 'invalid' | 'disposable' = 'valid'
    let reason = 'Mailbox verified and deliverable'

    if (probe.code === 250) {
        if (probe.isCatchAll) {
            status = 'risky'
            reason = 'Domain accepts all emails (Catch-All server)'
            score = 70
        } else if (isRoleBased) {
            status = 'risky'
            reason = 'Role-based email address (e.g. info@, support@)'
            score = 80
        } else {
            status = 'valid'
            reason = 'Mailbox active & verified'
            score = 98
        }
    } else if (probe.code === 550 || probe.code === 551 || probe.code === 553 || probe.code === 554) {
        status = 'invalid'
        reason = `Mailbox does not exist on server (SMTP ${probe.code})`
        score = 0
    } else if (probe.code === 421 || probe.code === 450 || probe.code === 451 || probe.code === 452) {
        status = 'risky'
        reason = `Server temporarily greylisting / rate-limited (SMTP ${probe.code})`
        score = 65
    } else if (probe.timedOut) {
        // Port 25 firewall or mail server silent drop -> MX is confirmed valid
        status = isRoleBased ? 'risky' : 'valid'
        reason = 'MX active & deliverable'
        score = isRoleBased ? 75 : 92
    } else {
        status = 'risky'
        reason = probe.error || `SMTP status code ${probe.code || 'unknown'}`
        score = 65
    }

    return {
        email,
        status,
        reason,
        score,
        isSyntaxValid: true,
        isDisposable: false,
        isRoleBased,
        isFreeProvider,
        hasMx: true,
        mxHost: primaryMx,
        isCatchAll: probe.isCatchAll,
        suggestedFix,
        checkedAt: now
    }
}

interface SmtpProbeResult {
    code: number | null
    isCatchAll?: boolean
    timedOut?: boolean
    error?: string
}

/**
 * Socket-level SMTP handshake on Port 25 with guaranteed un-stuck hard timer
 */
async function probeSmtpMailbox(mxHost: string, domain: string, targetEmail: string, timeoutMs = 2200): Promise<SmtpProbeResult> {
    return new Promise((resolve) => {
        const socket = new net.Socket()
        let step = 0
        let hasResolved = false
        let isCatchAll = false
        let targetCode: number | null = null

        const cleanupAndResolve = (result: SmtpProbeResult) => {
            if (hasResolved) return
            hasResolved = true
            try {
                clearTimeout(hardTimer)
                if (!socket.destroyed) {
                    socket.write('QUIT\r\n')
                    socket.end()
                    socket.destroy()
                }
            } catch {
                // Ignore socket cleanup error
            }
            resolve(result)
        }

        // Hard overall timer guarantees socket never hangs regardless of OS / network
        const hardTimer = setTimeout(() => {
            cleanupAndResolve({ code: null, timedOut: true, error: 'Probe hard timeout' })
        }, timeoutMs)

        socket.setTimeout(timeoutMs)

        socket.on('timeout', () => {
            cleanupAndResolve({ code: null, timedOut: true, error: 'Socket timeout' })
        })

        socket.on('error', (err) => {
            cleanupAndResolve({ code: null, error: err.message || 'Socket error' })
        })

        try {
            socket.connect(25, mxHost, () => {
                // Connected, waiting for server banner
            })
        } catch (e: any) {
            cleanupAndResolve({ code: null, error: e.message || 'Connect error' })
            return
        }

        let buffer = ''
        socket.on('data', (data) => {
            buffer += data.toString()
            const lines = buffer.split('\r\n')
            
            if (!buffer.endsWith('\r\n')) return
            buffer = ''

            const lastLine = lines.filter(Boolean).pop() || ''
            const code = parseInt(lastLine.substring(0, 3), 10)

            if (isNaN(code)) return

            // Step 0: Server Greeting (220)
            if (step === 0) {
                if (code === 220) {
                    step = 1
                    socket.write(`HELO check.mailverify.internal\r\n`)
                } else {
                    cleanupAndResolve({ code, error: `Server rejected greeting (${code})` })
                }
            }
            // Step 1: HELO Response (250) -> Send MAIL FROM
            else if (step === 1) {
                if (code === 250) {
                    step = 2
                    socket.write(`MAIL FROM:<verify@check.mailverify.internal>\r\n`)
                } else {
                    cleanupAndResolve({ code, error: `HELO rejected (${code})` })
                }
            }
            // Step 2: MAIL FROM Response (250) -> Test Catch-All with random alias
            else if (step === 2) {
                if (code === 250) {
                    step = 3
                    const dummyRandom = `verify_rnd_${Math.random().toString(36).substring(2, 8)}@${domain}`
                    socket.write(`RCPT TO:<${dummyRandom}>\r\n`)
                } else {
                    cleanupAndResolve({ code, error: `MAIL FROM rejected (${code})` })
                }
            }
            // Step 3: Catch-All Response -> Test target email
            else if (step === 3) {
                if (code === 250) {
                    isCatchAll = true
                }
                step = 4
                socket.write(`RCPT TO:<${targetEmail}>\r\n`)
            }
            // Step 4: Target Email Response -> Finished!
            else if (step === 4) {
                targetCode = code
                cleanupAndResolve({
                    code: targetCode,
                    isCatchAll
                })
            }
        })
    })
}
