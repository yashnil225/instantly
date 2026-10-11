import nodemailer from 'nodemailer'

interface EmailConfig {
    host: string
    port: number
    user: string
    pass: string
    messageId?: string
    inReplyTo?: string
    references?: string | string[]
}

export function htmlToEmailText(html: string): string {
    if (!html) return ''
    if (!/<[a-z][\s\S]*>/i.test(html)) {
        return html.trim()
    }
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<hr\s*\/?>/gi, '\n---\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

export function formatEmailBody(rawBody: string): { html: string; text: string } {
    if (!rawBody) return { html: '', text: '' }

    const text = htmlToEmailText(rawBody)

    let html = rawBody

    // 1. Preserve empty spacer lines that browsers generate in contentEditable
    // (<div><br></div>, <p><br></p>, etc.) by converting them to non-collapsible spacer divs
    html = html.replace(/<(div|p)\b[^>]*>\s*<br\s*\/?>\s*<\/\1>/gi, '<div style="min-height: 20px; line-height: 20px; margin: 0; padding: 0;">&nbsp;</div>')
    html = html.replace(/<div\b[^>]*>\s*<\/div>/gi, '<div style="min-height: 20px; line-height: 20px; margin: 0; padding: 0;">&nbsp;</div>')
    html = html.replace(/<p\b[^>]*>\s*<\/p>/gi, '<div style="min-height: 20px; line-height: 20px; margin: 0; padding: 0;">&nbsp;</div>')

    // 2. Check if rich HTML structure exists
    const isRichHtml = /<(p|div|table|ul|ol|h[1-6])\b/i.test(html)

    if (!isRichHtml) {
        // Plain text with newlines: convert newlines to <br />
        html = html.replace(/\r\n/g, '\n').replace(/\n/g, '<br />')
    } else {
        // Rich HTML: convert any loose newlines outside tags into <br />
        html = html.replace(/([^>])\n([^<])/g, '$1<br />$2')
    }

    // 3. Ensure <p> tags have explicit bottom margin so paragraphs don't stick together
    html = html.replace(/<p\b[^>]*>/gi, '<p style="margin: 0; padding: 0; margin-bottom: 14px; line-height: 24px; mso-line-height-rule: exactly; mso-margin-bottom-alt: 14px;">')

    // 4. Ensure <div> tags have line-height and don't collapse
    html = html.replace(/<div\b(?![^>]*style=)[^>]*>/gi, '<div style="margin: 0; padding: 0; line-height: 24px; mso-line-height-rule: exactly;">')

    // 5. Wrap in outer container with font stack, 24px line height, and white-space: pre-wrap
    const styledHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 24px; mso-line-height-rule: exactly; color: #000000; font-size: 15px; white-space: pre-wrap;">${html}</div>`

    return { html: styledHtml, text }
}

export async function createTransporter(config: EmailConfig) {
    // Always use SMTP with app password (OAuth2 removed for stability)
    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465, // true for 465, false for other ports
        auth: {
            user: config.user,
            pass: config.pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
    })
}

export async function sendEmail({
    config,
    to,
    subject,
    html,
    text,
    fromName,
    fromEmail,
}: {
    config: EmailConfig
    to: string
    subject: string
    html: string
    text?: string
    fromName: string
    fromEmail: string
}) {
    const transporter = await createTransporter(config)
    const { inReplyTo, references, messageId } = config

    const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text,
        messageId,
        inReplyTo,
        references,
    })

    return info
}
