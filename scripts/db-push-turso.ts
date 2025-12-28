import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function pushToTurso() {
    console.log("🚀 Generating SQL from Prisma schema...");
    try {
        // Use Prisma migrate diff to get the SQL for the current schema
        const sql = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script").toString();

        console.log("✅ SQL generated. Connecting to Turso...");

        const client = createClient({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN!,
        });

        console.log("🛰️  Pushing schema to Turso...");

        // Clean up SQL: remove comments and handle multi-line statements
        const cleanedSql = sql
            .replace(/--.*/g, "") // Remove single line comments
            .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments

        const statements = cleanedSql
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📦 Executing ${statements.length} statements...`);

        for (const statement of statements) {
            try {
                await client.execute(statement);
            } catch (err: any) {
                // Ignore "table already exists" errors if we're pushing to an existing DB
                if (err.message && (err.message.includes("already exists") || err.message.includes("duplicate"))) {
                    console.log(`⚠️  Skipping: ${statement.substring(0, 50)}... (Already exists)`);
                } else {
                    throw err;
                }
            }
        }

        console.log("✨ Schema pushed successfully to Turso!");
    } catch (error) {
        console.error("❌ Failed to push schema:", error);
        process.exit(1);
    }
}

pushToTurso();
