import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Do not use "const prisma = ..." in global scope if using hot reload heavily, 
// but for standard route it is standard. Ideally import from a lib.
const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const campaignId = id

        const leads = await prisma.lead.findMany({
            where: { campaignId },
            orderBy: { createdAt: 'desc' },
            select: {
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                status: true
            }
        })

        if (!leads || leads.length === 0) {
            return new NextResponse('No leads found', { status: 404 })
        }

        const headers = ['Email', 'First Name', 'Last Name', 'Company', 'Status']
        const csvRows = [headers.join(',')]

        for (const lead of leads) {
            const row = [
                lead.email,
                lead.firstName || '',
                lead.lastName || '',
                lead.company || '',
                lead.status
            ]
            // Simple CSV escaping
            const escapedRow = row.map(cell => {
                if (cell === null || cell === undefined) return ''
                const str = String(cell)
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`
                }
                return str
            })
            csvRows.push(escapedRow.join(','))
        }

        const csvContent = csvRows.join('\n')

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="leads-export-${campaignId}-${new Date().toISOString().split('T')[0]}.csv"`
            }
        })

    } catch (error) {
        console.error('Export failed:', error)
        return new NextResponse('Export failed', { status: 500 })
    }
}
