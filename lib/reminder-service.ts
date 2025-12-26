import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function processReminders() {
    try {
        const now = new Date()

        // Fetch Due Reminders
        const reminders = await prisma.reminder.findMany({
            where: {
                status: 'pending',
                scheduledAt: { lte: now }
            }
        })

        if (reminders.length === 0) {
            return { processed: 0, errors: 0 }
        }

        let processed = 0
        let errors = 0

        for (const reminder of reminders) {
            try {
                // Fetch User
                const user = await prisma.user.findUnique({
                    where: { id: reminder.userId }
                })

                if (!user || !user.email) {
                    await prisma.reminder.update({
                        where: { id: reminder.id },
                        data: { status: 'failed', message: (reminder.message || '') + ' [User not found]' }
                    })
                    continue
                }

                // Fetch Lead Context
                let leadDetails = ""
                if (reminder.leadId) {
                    const lead = await prisma.lead.findUnique({ where: { id: reminder.leadId } })
                    if (lead) {
                        leadDetails = `
                            <p><strong>Lead:</strong> ${lead.firstName || ''} ${lead.lastName || ''} (${lead.email})</p>
                            <p><strong>Company:</strong> ${lead.company || 'N/A'}</p>
                        `
                    }
                }

                // Find a sender account
                const senderAccount = await prisma.emailAccount.findFirst({
                    where: { status: 'active' }
                })

                if (!senderAccount) {
                    await prisma.reminder.update({
                        where: { id: reminder.id },
                        data: { status: 'failed_no_sender' }
                    })
                    errors++
                    continue
                }

                // Send Email
                await sendEmail({
                    config: {
                        host: senderAccount.smtpHost || '',
                        port: senderAccount.smtpPort || 587,
                        user: senderAccount.smtpUser || '',
                        pass: senderAccount.smtpPass || ''
                    },
                    to: user.email,
                    subject: `Reminder: ${reminder.message || 'Follow up'}`,
                    html: `
                        <h2>You have a new reminder</h2>
                        <p><strong>Note:</strong> ${reminder.message}</p>
                        <p><strong>Time:</strong> ${new Date(reminder.scheduledAt).toLocaleString()}</p>
                        <hr />
                        ${leadDetails}
                        <br />
                        <p style="font-size: 12px; color: #888;">Sent via Instantly Unibox</p>
                    `,
                    fromName: "Instantly Reminder",
                    fromEmail: senderAccount.email
                })

                // Update Status
                await prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { status: 'sent' }
                })

                processed++
                console.log(`[Reminder] Sent reminder ${reminder.id} to ${user.email}`)

            } catch (err) {
                console.error(`Failed to process reminder ${reminder.id}`, err)
                await prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { status: 'error' }
                })
                errors++
            }
        }

        return { processed, errors }

    } catch (error) {
        console.error("Reminder Service Failed", error)
        throw error
    }
}
