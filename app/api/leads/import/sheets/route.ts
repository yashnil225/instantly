
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
// We might need a CSV parser if we fetch the sheet ourselves,
// BUT typically "Google Sheets Import" means fetching JSON data via Google API or simply fetching the CSV export link.
// The easiest way for a "public" sheet (as per UI hint) is to fetch the /export?format=csv URL.
import Papa from 'papaparse'

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { campaignId, sheetUrl } = await request.json()

        if (!sheetUrl || !campaignId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        // 1. Transform URL to CSV Export URL if it's a standard edit URL
        // e.g. https://docs.google.com/spreadsheets/d/ID/edit... -> https://docs.google.com/spreadsheets/d/ID/export?format=csv
        let csvUrl = sheetUrl
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
        if (match && match[1]) {
            csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`
        }

        // 2. Fetch the CSV
        const response = await fetch(csvUrl)
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch Google Sheet. Make sure it is public.' }, { status: 400 })
        }
        const csvText = await response.text()

        // 3. Parse CSV
        const { data, meta } = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        })

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Sheet is empty' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            data: data, // Return raw data to frontend for mapping
            headers: meta.fields
        })

    } catch (error) {
        console.error('Sheet fetch failed:', error)
        return NextResponse.json({ error: 'Failed to process Google Sheet' }, { status: 500 })
    }
}
