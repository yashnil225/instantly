import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportData {
    title: string
    subtitle?: string
    generatedAt: Date
    stats?: {
        label: string
        value: string | number
    }[]
    tableData?: {
        headers: string[]
        rows: (string | number)[][]
    }
}

export function generatePDFReport(data: ReportData): void {
    const doc = new jsPDF()

    // Header
    doc.setFillColor(17, 24, 39) // Dark background
    doc.rect(0, 0, 210, 40, 'F')

    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(data.title, 20, 25)

    // Subtitle
    if (data.subtitle) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(156, 163, 175)
        doc.text(data.subtitle, 20, 35)
    }

    let yPos = 55

    // Stats cards
    if (data.stats && data.stats.length > 0) {
        doc.setTextColor(107, 114, 128)
        doc.setFontSize(10)
        doc.text('SUMMARY', 20, yPos)
        yPos += 10

        const cardWidth = 40
        const cardGap = 5
        let xPos = 20

        data.stats.forEach((stat, index) => {
            if (index > 0 && index % 4 === 0) {
                yPos += 30
                xPos = 20
            }

            // Card background
            doc.setFillColor(243, 244, 246)
            doc.roundedRect(xPos, yPos, cardWidth, 25, 3, 3, 'F')

            // Value
            doc.setTextColor(17, 24, 39)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text(String(stat.value), xPos + 5, yPos + 12)

            // Label
            doc.setTextColor(107, 114, 128)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text(stat.label, xPos + 5, yPos + 20)

            xPos += cardWidth + cardGap
        })

        yPos += 40
    }

    // Table
    if (data.tableData && data.tableData.rows.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [data.tableData.headers],
            body: data.tableData.rows,
            theme: 'striped',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [55, 65, 81]
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { left: 20, right: 20 }
        })
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text(
            `Generated on ${data.generatedAt.toLocaleDateString()} at ${data.generatedAt.toLocaleTimeString()} | Page ${i} of ${pageCount}`,
            20,
            doc.internal.pageSize.height - 10
        )
    }

    // Save
    const filename = `${data.title.toLowerCase().replace(/\s+/g, '-')}-${data.generatedAt.toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}

// Campaign-specific report
export function generateCampaignReport(campaign: any): void {
    generatePDFReport({
        title: campaign.name,
        subtitle: `Campaign Performance Report`,
        generatedAt: new Date(),
        stats: [
            { label: 'Total Sent', value: campaign.sentCount || 0 },
            { label: 'Opens', value: campaign.openCount || 0 },
            { label: 'Clicks', value: campaign.clickCount || 0 },
            { label: 'Replies', value: campaign.replyCount || 0 },
            { label: 'Bounces', value: campaign.bounceCount || 0 },
            { label: 'Open Rate', value: `${campaign.openRate || 0}%` },
            { label: 'Reply Rate', value: `${campaign.replyRate || 0}%` },
            { label: 'Status', value: campaign.status }
        ]
    })
}

// Accounts report
export function generateAccountsReport(accounts: any[]): void {
    generatePDFReport({
        title: 'Email Accounts Report',
        subtitle: `${accounts.length} accounts`,
        generatedAt: new Date(),
        stats: [
            { label: 'Total Accounts', value: accounts.length },
            { label: 'Active', value: accounts.filter(a => a.status === 'active').length },
            { label: 'Warming', value: accounts.filter(a => a.isWarming).length },
            { label: 'With Errors', value: accounts.filter(a => a.hasError).length }
        ],
        tableData: {
            headers: ['Email', 'Status', 'Sent', 'Warmup', 'Health'],
            rows: accounts.map(a => [
                a.email,
                a.status,
                a.emailsSent || 0,
                a.warmupEmails || 0,
                `${a.healthScore || 0}%`
            ])
        }
    })
}

// Analytics report
export function generateAnalyticsReport(data: {
    period: string
    sent: number
    opens: number
    clicks: number
    replies: number
    bounces: number
    campaigns?: any[]
}): void {
    generatePDFReport({
        title: 'Analytics Report',
        subtitle: data.period,
        generatedAt: new Date(),
        stats: [
            { label: 'Emails Sent', value: data.sent },
            { label: 'Opens', value: data.opens },
            { label: 'Clicks', value: data.clicks },
            { label: 'Replies', value: data.replies },
            { label: 'Bounces', value: data.bounces },
            { label: 'Open Rate', value: `${data.sent ? Math.round((data.opens / data.sent) * 100) : 0}%` },
            { label: 'Reply Rate', value: `${data.sent ? Math.round((data.replies / data.sent) * 100) : 0}%` }
        ],
        tableData: data.campaigns ? {
            headers: ['Campaign', 'Sent', 'Opens', 'Clicks', 'Replies'],
            rows: data.campaigns.map(c => [
                c.name,
                c.sentCount || 0,
                c.openCount || 0,
                c.clickCount || 0,
                c.replyCount || 0
            ])
        } : undefined
    })
}
