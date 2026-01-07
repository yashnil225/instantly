import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { checkReplies } from "@/lib/replies";
import { processBatch } from "@/lib/sender";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Request up to 60s for background tasks (Pro plan)

/**
 * Master Sync Endpoint (Self-Driving Automation)
 * GET /api/v2/automate/sync
 * 
 * Triggers:
 * 1. IMAP Sync + AI Autoreply detection
 * 2. Campaign Sequence processing (Batch Sending)
 * 3. Stats updating
 */
export async function GET(req: NextRequest) {
    const auth = await validateApiKey();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
    }

    try {
        console.log(`[Self-Driving] Master sync triggered by user: ${auth.user.email}`);

        // 1. Run Reply Sync (Includes AI Autoreply logic)
        const replyResult = await checkReplies();
        console.log(`[Self-Driving] Reply Sync: ${replyResult.detected} replies detected.`);

        // 2. Run Sending Batch (Sends pending sequence emails)
        const sendResult = await processBatch();
        console.log(`[Self-Driving] Send Batch: ${sendResult.totalSent} emails sent.`);

        return NextResponse.json({
            status: "success",
            timestamp: new Date().toISOString(),
            results: {
                replies: {
                    checked: replyResult.checked,
                    detected: replyResult.detected,
                    errors: replyResult.errors
                },
                sending: {
                    sent: sendResult.totalSent,
                    errors: sendResult.errors
                }
            },
            message: "Self-driving sync completed successfully."
        });

    } catch (error: any) {
        console.error("[Self-Driving] Master Sync Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
