/*
  Warnings:

  - You are about to drop the column `isFavorite` on the `EmailAccount` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email,campaignId]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "phone" TEXT;
ALTER TABLE "Lead" ADD COLUMN "website" TEXT;

-- AlterTable
ALTER TABLE "SequenceVariant" ADD COLUMN "label" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "provider" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUser" TEXT,
    "imapPass" TEXT,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" BIGINT,
    "idToken" TEXT,
    "scope" TEXT,
    "dailyLimit" INTEGER NOT NULL DEFAULT 50,
    "minWaitTime" INTEGER NOT NULL DEFAULT 1,
    "slowRamp" BOOLEAN NOT NULL DEFAULT true,
    "signature" TEXT,
    "warmupTag" TEXT,
    "warmupDailyLimit" INTEGER NOT NULL DEFAULT 50,
    "warmupReplyRate" INTEGER NOT NULL DEFAULT 30,
    "sentToday" INTEGER NOT NULL DEFAULT 0,
    "warmupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "warmupCurrentDay" INTEGER NOT NULL DEFAULT 1,
    "warmupDailyIncrease" INTEGER NOT NULL DEFAULT 5,
    "warmupMaxPerDay" INTEGER NOT NULL DEFAULT 50,
    "warmupSentToday" INTEGER NOT NULL DEFAULT 0,
    "warmupRepliedToday" INTEGER NOT NULL DEFAULT 0,
    "warmupPoolOptIn" BOOLEAN NOT NULL DEFAULT false,
    "warmupScore" INTEGER NOT NULL DEFAULT 100,
    "lastActive" DATETIME,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncedAt" DATETIME,
    "bounceCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailAccount" ("accessToken", "bounceCount", "createdAt", "dailyLimit", "email", "errorDetail", "expiresAt", "firstName", "healthScore", "id", "idToken", "imapHost", "imapPass", "imapPort", "imapUser", "lastActive", "lastName", "lastSyncedAt", "minWaitTime", "provider", "refreshToken", "scope", "sentToday", "signature", "slowRamp", "smtpHost", "smtpPass", "smtpPort", "smtpUser", "status", "updatedAt", "userId", "warmupCurrentDay", "warmupDailyIncrease", "warmupDailyLimit", "warmupEnabled", "warmupMaxPerDay", "warmupPoolOptIn", "warmupRepliedToday", "warmupReplyRate", "warmupScore", "warmupSentToday", "warmupTag") SELECT "accessToken", "bounceCount", "createdAt", "dailyLimit", "email", "errorDetail", "expiresAt", "firstName", "healthScore", "id", "idToken", "imapHost", "imapPass", "imapPort", "imapUser", "lastActive", "lastName", "lastSyncedAt", "minWaitTime", "provider", "refreshToken", "scope", "sentToday", "signature", "slowRamp", "smtpHost", "smtpPass", "smtpPort", "smtpUser", "status", "updatedAt", "userId", "warmupCurrentDay", "warmupDailyIncrease", "warmupDailyLimit", "warmupEnabled", "warmupMaxPerDay", "warmupPoolOptIn", "warmupRepliedToday", "warmupReplyRate", "warmupScore", "warmupSentToday", "warmupTag" FROM "EmailAccount";
DROP TABLE "EmailAccount";
ALTER TABLE "new_EmailAccount" RENAME TO "EmailAccount";
CREATE UNIQUE INDEX "EmailAccount_email_key" ON "EmailAccount"("email");
CREATE TABLE "new_SendingEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "messageId" TEXT,
    "emailAccountId" TEXT,
    "metadata" TEXT,
    "details" TEXT,
    "hasAttachment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SendingEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SendingEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SendingEvent_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SendingEvent" ("campaignId", "createdAt", "emailAccountId", "id", "leadId", "messageId", "metadata", "type") SELECT "campaignId", "createdAt", "emailAccountId", "id", "leadId", "messageId", "metadata", "type" FROM "SendingEvent";
DROP TABLE "SendingEvent";
ALTER TABLE "new_SendingEvent" RENAME TO "SendingEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_campaignId_key" ON "Lead"("email", "campaignId");
