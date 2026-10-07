import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const cws = await client.execute("SELECT * FROM CampaignWorkspace");
    console.log("CampaignWorkspaces:", cws.rows);
    const ws = await client.execute("SELECT * FROM Workspace");
    console.log("Workspaces:", ws.rows);
}

run().catch(console.error);
