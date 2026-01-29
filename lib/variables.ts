
export function replaceVariables(text: string, lead: any): string {
    if (!text) return ""
    let result = text

    // Helper to clean values (strip HTML if present in the data variable)
    const clean = (val: any) => {
        if (!val) return ''
        return String(val).replace(/<[^>]*>/g, '').trim()
    }

    // Standard Fields - Case Insensitive, allow optional spaces
    result = result.replace(/{{\s*firstName\s*}}/gi, clean(lead.firstName))
    result = result.replace(/{{\s*lastName\s*}}/gi, clean(lead.lastName))
    result = result.replace(/{{\s*email\s*}}/gi, clean(lead.email))
    result = result.replace(/{{\s*company\s*}}/gi, clean(lead.company))

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
