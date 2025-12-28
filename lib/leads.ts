export interface NormalizedLead {
    email: string
    firstName: string
    lastName: string
    company: string
    customFields?: string
}

export function normalizeLead(record: any): NormalizedLead | null {
    // Helper to find value by fuzzy key match
    const findValue = (keywords: string[]): string => {
        // 1. Exact match (case insensitive already handled if keys lowercased)
        // 2. Contains match
        const keys = Object.keys(record)

        // Try strict match first
        let key = keys.find(k => keywords.includes(k.toLowerCase().trim()))

        // Try partial match if no exact
        if (!key) {
            key = keys.find(k => keywords.some(w => k.toLowerCase().includes(w)))
        }

        if (key) {
            const val = record[key]
            return typeof val === 'string' ? val.trim() : String(val).trim()
        }
        return ''
    }

    // 1. Find Email (Required)
    const email = findValue(['email', 'e-mail', 'mail', 'email address', 'e-mail address']) ||
        // Fallback: Check values for @ symbol if no key match
        Object.values(record).find(v => typeof v === 'string' && v.includes('@')) as string

    if (!email || !email.includes('@')) {
        return null
    }

    // 2. Find Name
    // Some CSVs have 'name' (full), others 'first_name', 'last_name'
    let firstName = findValue(['first name', 'firstname', 'fname', 'first'])
    let lastName = findValue(['last name', 'lastname', 'lname', 'last', 'surname'])

    if (!firstName && !lastName) {
        const fullName = findValue(['name', 'full name', 'fullname'])
        if (fullName) {
            const parts = fullName.split(' ')
            firstName = parts[0]
            lastName = parts.slice(1).join(' ')
        }
    }

    // 3. Find Company
    const company = findValue(['company', 'company name', 'business', 'organization', 'website'])

    // 4. Capture Custom Fields (everything else)
    const customFields: Record<string, any> = {}
    const capturedKeys = new Set(['email', 'first name', 'firstname', 'fname', 'first', 'last name', 'lastname', 'lname', 'last', 'surname', 'name', 'full name', 'fullname', 'company', 'company name', 'business', 'organization', 'website'])

    Object.keys(record).forEach(key => {
        const lowerKey = key.toLowerCase().trim()
        if (!capturedKeys.has(lowerKey)) {
            customFields[key] = record[key]
        }
    })

    return {
        email: email.toLowerCase(),
        firstName,
        lastName,
        company,
        customFields: Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : undefined
    }
}
