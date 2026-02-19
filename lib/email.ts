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
    })
}

export async function sendEmail({
    config,
    to,
    subject,
    html,
    fromName,
    fromEmail,
}: {
    config: EmailConfig
    to: string
    subject: string
    html: string
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
        messageId,
        inReplyTo,
        references,
    })

    return info
}
