import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const leadId = 'cmsuiehhn009j787h3ixsbgq1';
    const events = await client.execute(`SELECT id, type, createdAt, metadata FROM SendingEvent WHERE leadId = '${leadId}'`);
    console.log("Events for lead with reply:", events.rows);
}

run().catch(console.error);
