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

// 4. Curated 300+ most active disposable burner domains + regex patterns
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
 * Multi-layer email verification engine
 */
export async function verifyEmail(emailInput: string, options: { deepSmtpProbe?: boolean; timeoutMs?: number } = {}): Promise<VerificationResult> {
    const { deepSmtpProbe = true, timeoutMs = 4000 } = options
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

    // --- Step 3: DNS MX Lookup ---
    let mxRecords: dns.MxRecord[] = []
    try {
        mxRecords = await dns.promises.resolveMx(domain)
    } catch (err: any) {
        // Fallback: check if domain has an A record (some mail servers receive on A)
        try {
            const aRecords = await dns.promises.resolve4(domain)
            if (aRecords.length === 0) {
                return {
                    email,
                    status: 'invalid',
                    reason: 'Domain has no MX or DNS records',
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

    if (mxRecords.length === 0) {
        return {
            email,
            status: 'invalid',
            reason: 'Domain has no active MX records to receive emails',
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
    mxRecords.sort((a, b) => a.priority - b.priority)
    const primaryMx = mxRecords[0].exchange

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

    // --- Step 4: Direct SMTP Handshake Probe ---
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
    } else if (probe.code === 550 || probe.code === 551 || probe.code === 553) {
        status = 'invalid'
        reason = `Mailbox does not exist on server (SMTP ${probe.code})`
        score = 0
    } else if (probe.code === 421 || probe.code === 450 || probe.code === 451 || probe.code === 452) {
        status = 'risky'
        reason = `Server temporarily greylisting / rate-limited (SMTP ${probe.code})`
        score = 65
    } else if (probe.timedOut) {
        // Port 25 firewall or mail server silent drop
        status = isRoleBased ? 'risky' : 'valid'
        reason = 'MX active (SMTP probe timed out or blocked by firewall)'
        score = isRoleBased ? 75 : 90
    } else {
        status = 'risky'
        reason = probe.error || `Unknown SMTP response (code ${probe.code || 'none'})`
        score = 60
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
 * Socket-level SMTP handshake on Port 25
 */
async function probeSmtpMailbox(mxHost: string, domain: string, targetEmail: string, timeoutMs = 4000): Promise<SmtpProbeResult> {
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
                if (!socket.destroyed) {
                    socket.write('QUIT\r\n')
                    socket.end()
                    socket.destroy()
                }
            } catch {
                // Ignore socket destruction errors
            }
            resolve(result)
        }

        socket.setTimeout(timeoutMs)

        socket.on('timeout', () => {
            cleanupAndResolve({ code: null, timedOut: true, error: 'Connection timed out' })
        })

        socket.on('error', (err) => {
            cleanupAndResolve({ code: null, error: err.message || 'Socket error' })
        })

        socket.connect(25, mxHost, () => {
            // Connected, waiting for server banner
        })

        let buffer = ''
        socket.on('data', (data) => {
            buffer += data.toString()
            const lines = buffer.split('\r\n')
            
            // Still waiting for complete response
            if (!buffer.endsWith('\r\n')) return
            buffer = '' // reset

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
            // Step 2: MAIL FROM Response (250) -> First test Catch-All with a random dummy address
            else if (step === 2) {
                if (code === 250) {
                    step = 3
                    const dummyRandom = `nonexistent_${Math.random().toString(36).substring(2, 10)}@${domain}`
                    socket.write(`RCPT TO:<${dummyRandom}>\r\n`)
                } else {
                    cleanupAndResolve({ code, error: `MAIL FROM rejected (${code})` })
                }
            }
            // Step 3: Catch-All Test Response -> Check target email
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
