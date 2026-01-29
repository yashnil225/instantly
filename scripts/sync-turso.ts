import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function sync() {
    console.log("🚀 Starting Turso sync...");

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error("❌ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN missing in .env");
        process.exit(1);
    }

    const client = createClient({
        url,
        authToken,
    });

    const columnsToAdd = [
        { name: "scheduleName", type: "TEXT" },
        { name: "startTime", type: "TEXT" },
        { name: "endTime", type: "TEXT" },
        { name: "timezone", type: "TEXT" },
        { name: "days", type: "TEXT" },
        { name: "startDate", type: "DATETIME" },
        { name: "endDate", type: "DATETIME" },
        { name: "schedules", type: "TEXT" }
    ];

    for (const column of columnsToAdd) {
        try {
            console.log(`Adding column ${column.name}...`);
            await client.execute(`ALTER TABLE Campaign ADD COLUMN ${column.name} ${column.type}`);
            console.log(`✅ Column ${column.name} added.`);
        } catch (error: any) {
            if (error.message.includes("duplicate column name")) {
                console.log(`ℹ️ Column ${column.name} already exists. Skipping.`);
            } else {
                console.warn(`⚠️ Error adding column ${column.name}: ${error.message}`);
            }
        }
    }

    const leadColumnsToAdd = [
        { name: "isStarred", type: "BOOLEAN", default: "0" },
        { name: "isArchived", type: "BOOLEAN", default: "0" }
    ];

    for (const column of leadColumnsToAdd) {
        try {
            console.log(`Adding column ${column.name} to Lead...`);
            // SQLite uses integer 0/1 for booleans. DEFAULT 0 is false.
            await client.execute(`ALTER TABLE Lead ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`);
            console.log(`✅ Column ${column.name} added to Lead.`);
        } catch (error: any) {
            if (error.message.includes("duplicate column name")) {
                console.log(`ℹ️ Column ${column.name} already exists in Lead. Skipping.`);
            } else {
                console.warn(`⚠️ Error adding column ${column.name} to Lead: ${error.message}`);
            }
        }
    }

    console.log("🏁 Sync completed.");
}

sync().catch(console.error);
