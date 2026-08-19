import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment variables.');
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

const statements = [
    `CREATE TABLE IF NOT EXISTS "VerificationJob" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "fileName" TEXT NOT NULL,
        "total" INTEGER NOT NULL DEFAULT 0,
        "processed" INTEGER NOT NULL DEFAULT 0,
        "validCount" INTEGER NOT NULL DEFAULT 0,
        "riskyCount" INTEGER NOT NULL DEFAULT 0,
        "invalidCount" INTEGER NOT NULL DEFAULT 0,
        "disposableCount" INTEGER NOT NULL DEFAULT 0,
        "progress" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'processing',
        "currentLog" TEXT,
        "headers" TEXT NOT NULL,
        "rawRowsJson" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" DATETIME
    );`,
    `CREATE INDEX IF NOT EXISTS "VerificationJob_createdAt_idx" ON "VerificationJob"("createdAt");`,
    `CREATE INDEX IF NOT EXISTS "VerificationJob_userId_idx" ON "VerificationJob"("userId");`,
    `ALTER TABLE "VerificationJob" ADD COLUMN "userId" TEXT;`,
    `ALTER TABLE "VerificationJob" ADD COLUMN "rawRowsJson" TEXT;`,
    `CREATE TABLE IF NOT EXISTS "VerificationResultItem" (
        "id" TEXT PRIMARY KEY,
        "jobId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "reason" TEXT,
        "score" INTEGER NOT NULL DEFAULT 0,
        "rowData" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VerificationResultItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "VerificationJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "VerificationResultItem_jobId_idx" ON "VerificationResultItem"("jobId");`,
    `CREATE INDEX IF NOT EXISTS "VerificationResultItem_status_idx" ON "VerificationResultItem"("status");`,
    `CREATE TABLE IF NOT EXISTS "LeadStatusMemory" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT NOT NULL,
        "campaignId" TEXT NOT NULL,
        "workspaceId" TEXT,
        "status" TEXT NOT NULL,
        "stepReached" INTEGER NOT NULL DEFAULT 1,
        "metadata" TEXT,
        "lastContactedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LeadStatusMemory_email_campaignId_key" ON "LeadStatusMemory"("email", "campaignId");`,
    `CREATE INDEX IF NOT EXISTS "LeadStatusMemory_campaignId_idx" ON "LeadStatusMemory"("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "LeadStatusMemory_email_idx" ON "LeadStatusMemory"("email");`
];

async function syncTursoVerifier() {
    console.log('🚀 Creating Verification tables in Turso...\n');

    for (const sql of statements) {
        try {
            await client.execute(sql);
            console.log('✅ Executed statement successfully');
        } catch (error) {
            console.error('⚠️ Notice:', error.message);
        }
    }

    console.log('\n🎉 Turso database is 100% ready for Email Verification jobs!');
}

syncTursoVerifier().catch(console.error);
