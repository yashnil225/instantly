import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const accs = await client.execute("SELECT id, email, userId FROM EmailAccount");
    console.log("EmailAccounts:", accs.rows);
}

run().catch(console.error);
