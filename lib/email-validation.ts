/**
 * Email validation utilities
 */

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// List of known disposable/temporary email domains
const DISPOSABLE_DOMAINS = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'getnada.com',
    'yopmail.com', 'sharklasers.com', 'trashmail.com', 'tempail.com'
]

// Common typo corrections for popular domains
const DOMAIN_CORRECTIONS: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gamil.com': 'gmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outllook.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com'
}

export interface EmailValidationResult {
    isValid: boolean
    email: string
    errors: string[]
    warnings: string[]
    suggestions: string[]
}

/**
 * Validates an email address with comprehensive checks
 */
export function validateEmail(email: string): EmailValidationResult {
    const result: EmailValidationResult = {
        isValid: true,
        email: email.trim().toLowerCase(),
        errors: [],
        warnings: [],
        suggestions: []
    }

    const trimmedEmail = email.trim()

    // Basic format check
    if (!trimmedEmail) {
        result.isValid = false
        result.errors.push("Email address is required")
        return result
    }

    // Length check
    if (trimmedEmail.length > 254) {
        result.isValid = false
        result.errors.push("Email address is too long (max 254 characters)")
        return result
    }

    // Regex validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        result.isValid = false
        result.errors.push("Invalid email format")
        return result
    }

    // Extract domain
    const [localPart, domain] = trimmedEmail.split('@')

    // Local part checks
    if (localPart.length > 64) {
        result.isValid = false
        result.errors.push("Local part is too long (max 64 characters)")
        return result
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
        result.isValid = false
        result.errors.push("Local part cannot start or end with a dot")
        return result
    }

    if (localPart.includes('..')) {
        result.isValid = false
        result.errors.push("Local part cannot contain consecutive dots")
        return result
    }

    // Domain checks
    if (!domain || domain.length === 0) {
        result.isValid = false
        result.errors.push("Missing domain")
        return result
    }

    // Check for common typos
    const lowerDomain = domain.toLowerCase()
    if (DOMAIN_CORRECTIONS[lowerDomain]) {
        result.warnings.push(`Did you mean ${DOMAIN_CORRECTIONS[lowerDomain]}?`)
        result.suggestions.push(trimmedEmail.replace(domain, DOMAIN_CORRECTIONS[lowerDomain]))
    }

    // Check for disposable email
    if (DISPOSABLE_DOMAINS.some(d => lowerDomain.includes(d))) {
        result.warnings.push("This appears to be a disposable/temporary email address")
    }

    // Check for missing TLD
    if (!domain.includes('.')) {
        result.isValid = false
        result.errors.push("Domain must include a top-level domain (e.g., .com)")
        return result
    }

    // Check TLD length
    const tld = domain.split('.').pop() || ''
    if (tld.length < 2) {
        result.isValid = false
        result.errors.push("Invalid top-level domain")
        return result
    }

    return result
}

/**
 * Validates multiple emails and returns validation results
 */
export function validateEmails(emails: string[]): EmailValidationResult[] {
    return emails.map(validateEmail)
}

/**
 * Quick check if email is valid (boolean only)
 */
export function isValidEmail(email: string): boolean {
    return validateEmail(email).isValid
}

/**
 * Format email to lowercase and trim whitespace
 */
export function formatEmail(email: string): string {
    return email.trim().toLowerCase()
}

/**
 * Check for duplicate emails in a list
 */
export function findDuplicateEmails(emails: string[]): string[] {
    const formatted = emails.map(formatEmail)
    const seen = new Set<string>()
    const duplicates = new Set<string>()

    for (const email of formatted) {
        if (seen.has(email)) {
            duplicates.add(email)
        }
        seen.add(email)
    }

    return Array.from(duplicates)
}
