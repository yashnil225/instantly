import nodemailer from 'nodemailer'
import { prisma } from './prisma'

export async function sendEmail(options: {
    account: any,
    to: string,
    subject: string,
    html?: string,
    text?: string,
    cc?: string,
    bcc?: string,
    inReplyTo?: string,
    references?: string
}) {
    const { account } = options
    let transporter

    if (account.provider === 'google' && account.refreshToken) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: account.email,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: account.refreshToken
            }
        })
    } else {
        transporter = nodemailer.createTransport({
            host: account.smtpHost!,
            port: account.smtpPort!,
            secure: account.smtpPort === 465,
            auth: { user: account.smtpUser!, pass: account.smtpPass! }
        })
    }

    const mailOptions: any = {
        from: `"${account.firstName || ''} ${account.lastName || ''}" <${account.email}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc
    }

    if (options.inReplyTo) {
        mailOptions.headers = {
            'In-Reply-To': options.inReplyTo,
            'References': options.references || options.inReplyTo
        }
    }

    const info = await transporter.sendMail(mailOptions)
    return info
}
