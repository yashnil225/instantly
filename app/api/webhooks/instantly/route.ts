import { NextResponse } from 'next/server';
import { getCampaignKB } from '@/lib/google-sheets';
import { generateReply } from '@/lib/ai-reply';
import { instantlySendReply } from '@/lib/instantly-api';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('Received Instantly Webhook:', payload);

        const {
            event_type,
            campaign_id,
            campaign_name,
            lead_email,
            email_account,
            email_id,
            reply_subject,
            reply_text,
            reply_html,
            firstName, // Lead's first name
            companyName // Lead's company name
        } = payload;

        if (event_type !== 'reply') {
            return NextResponse.json({ status: 'ignored', message: 'Not a reply event' });
        }

        // Step 3: Extract Campaign ID
        // User says: Parse campaign_name (ID before "|") or use campaign_id directly.
        const cid = campaign_id || campaign_name?.split('|')[0]?.trim();

        if (!cid) {
            console.warn('No Campaign ID found in payload');
            return NextResponse.json({ status: 'error', message: 'No Campaign ID' }, { status: 400 });
        }

        // Step 4: Lookup Knowledge Base
        const kbData = await getCampaignKB(cid);
        if (!kbData || !kbData.knowledgeBase) {
            console.log(`No Knowledge Base found for campaign ${cid}. Skipping.`);
            return NextResponse.json({ status: 'success', skipped: true, message: 'No KB found' });
        }

        // Step 6: Generate Reply
        // Extract eaccount first name (eaccount format: "First Last <email>")
        const eaccountFirstName = email_account?.split(' ')[0] || 'Me';

        const generatedReply = await generateReply({
            knowledgeBase: kbData.knowledgeBase,
            replyExamples: kbData.replyExamples,
            incomingReply: reply_text || reply_html,
            senderName: firstName || lead_email,
            senderCompany: companyName || '',
            eaccountFirstName
        });

        // Step 7: Filter Empty Replies
        if (!generatedReply || generatedReply.trim() === '') {
            console.log('AI decided not to reply or generation failed. Skipping.');
            return NextResponse.json({ status: 'success', skipped: true });
        }

        // Step 8: Send Reply
        const result = await instantlySendReply({
            apiKey: process.env.INSTANTLY_API_KEY!,
            eaccount: email_account,
            reply_to_uuid: email_id,
            subject: reply_subject,
            html_body: generatedReply
        });

        return NextResponse.json({
            status: "success",
            skipped: false,
            reply_sent: true,
            message_id: result.id
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
