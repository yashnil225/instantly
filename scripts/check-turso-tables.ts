import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

async function checkTables() {
    console.log("🔍 Checking Turso tables...");

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    try {
        // List all tables
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
        console.log("\n📋 Tables in Turso:");
        result.rows.forEach((row: any) => {
            console.log(`  - ${row.name}`);
        });

        // Check specific tables
        const requiredTables = ['EmailAccount', 'WarmupLog', 'Campaign', 'CampaignEmailAccount', 'ApiKey', 'WebhookLog'];
        console.log("\n🔎 Checking required tables:");
        for (const table of requiredTables) {
            const found = result.rows.find((row: any) => row.name === table);
            console.log(`  ${found ? '✅' : '❌'} ${table}`);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

checkTables();
