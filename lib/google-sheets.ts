import { google } from 'googleapis';

export async function readSheet(spreadsheetId: string, range: string) {
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        // This expects GOOGLE_APPLICATION_CREDENTIALS to be set in .env
        // Or it will try to find a default credential file
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values;
}

export async function appendSheet(spreadsheetId: string, range: string, values: any[][]) {
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values },
    });

    return response.data;
}

export async function getCampaignKB(campaignId: string) {
    const spreadsheetId = '1QS7MYDm6RUTzzTWoMfX-0G9NzT5EoE2KiCE7iR1DBLM';
    const range = 'Sheet1!A:D'; // Adjust sheet name if necessary

    const rows = await readSheet(spreadsheetId, range);
    if (!rows || rows.length === 0) return null;

    // Assuming header: ID | Campaign Name | Knowledge Base | Reply Examples
    const header = rows[0];
    const idIndex = header.indexOf('ID');
    const kbIndex = header.indexOf('Knowledge Base');
    const examplesIndex = header.indexOf('Reply Examples');

    if (idIndex === -1) return null;

    const row = rows.find(r => r[idIndex] === campaignId);
    if (!row) return null;

    return {
        knowledgeBase: row[kbIndex] || '',
        replyExamples: row[examplesIndex] || ''
    };
}
