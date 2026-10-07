import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const ews = await client.execute("SELECT * FROM EmailAccountWorkspace");
    console.log("EmailAccountWorkspace:", ews.rows);
}

run().catch(console.error);
