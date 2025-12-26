import dns from 'dns'
import { promisify } from 'util'

const resolveMx = promisify(dns.resolveMx)

export interface EmailValidationResult {
    valid: boolean
    reason?: string
    mxRecords?: dns.MxRecord[]
}

/**
 * Validate email address format and MX records
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return {
            valid: false,
            reason: 'Invalid email format'
        }
    }

    // Extract domain
    const domain = email.split('@')[1]
    if (!domain) {
        return {
            valid: false,
            reason: 'No domain found'
        }
    }

    // Check MX records
    try {
        const mxRecords = await resolveMx(domain)

        if (!mxRecords || mxRecords.length === 0) {
            return {
                valid: false,
                reason: 'No MX records found for domain'
            }
        }

        return {
            valid: true,
            mxRecords
        }
    } catch (error) {
        return {
            valid: false,
            reason: `DNS lookup failed: ${error}`
        }
    }
}

/**
 * Batch validate multiple emails
 */
export async function validateEmails(emails: string[]): Promise<Map<string, EmailValidationResult>> {
    const results = new Map<string, EmailValidationResult>()

    for (const email of emails) {
        const result = await validateEmail(email)
        results.set(email, result)
    }

    return results
}
