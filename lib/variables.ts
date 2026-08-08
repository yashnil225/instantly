
export function replaceVariables(text: string, lead: any, account?: any): string {
    if (!text) return ""
    let result = text

    // Helper to clean values (strip HTML if present in the data variable)
    const clean = (val: any) => {
        if (!val) return ''
        return String(val).replace(/<[^>]*>/g, '').trim()
    }

    // Helper to return signature exactly as is (don't strip HTML from signature)
    const raw = (val: any) => {
        if (!val) return ''
        return String(val)
    }

    // Lead Fields
    result = result.replace(/{{\s*firstName\s*}}/gi, clean(lead.firstName))
    result = result.replace(/{{\s*lastName\s*}}/gi, clean(lead.lastName))
    result = result.replace(/{{\s*email\s*}}/gi, clean(lead.email))
    result = result.replace(/{{\s*company\s*}}/gi, clean(lead.company))

    // Sender/Account Fields
    if (account) {
        result = result.replace(/{{\s*senderFirstName\s*}}/gi, clean(account.firstName))
        result = result.replace(/{{\s*sendingAccountFirstName\s*}}/gi, clean(account.firstName))
        
        result = result.replace(/{{\s*senderLastName\s*}}/gi, clean(account.lastName))
        result = result.replace(/{{\s*sendingAccountLastName\s*}}/gi, clean(account.lastName))
        
        const senderName = `${account.firstName || ''} ${account.lastName || ''}`.trim()
        result = result.replace(/{{\s*senderName\s*}}/gi, clean(senderName))
        result = result.replace(/{{\s*sendingAccountName\s*}}/gi, clean(senderName))
        
        // Signature might contain HTML, so we don't strip tags
        result = result.replace(/{{\s*signature\s*}}/gi, raw(account.signature))
    }

    // Custom Fields
    if (lead.customFields) {
        try {
            const customFields = typeof lead.customFields === 'string'
                ? JSON.parse(lead.customFields)
                : lead.customFields

            for (const [key, value] of Object.entries(customFields)) {
                // Case insensitive match for custom fields too
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
                result = result.replace(regex, clean(value))
            }
        } catch (e) {
            console.error('Failed to parse custom fields for variable replacement:', e)
        }
    }

    // Fallback: Custom fields might be direct properties on the lead object in some contexts
    // (though usually they are in customFields JSON)

    // Cleanup: Remove any remaining unmatched variables {{...}}
    result = result.replace(/{{\s*[^}]+\s*}}/g, '')

    return result
}
