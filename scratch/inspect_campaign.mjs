import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const nonSent = await client.execute("SELECT id, type, leadId, metadata FROM SendingEvent WHERE campaignId='cmstulkic0000w2upph3jd7dd' AND type != 'sent'");
    console.log("Non-sent Events:", nonSent.rows);
}

run().catch(console.error);
