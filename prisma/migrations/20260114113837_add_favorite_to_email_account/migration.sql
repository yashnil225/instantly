/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "schedules" TEXT;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

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
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncedAt" DATETIME,
    "bounceCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailAccount" ("bounceCount", "createdAt", "dailyLimit", "email", "errorDetail", "firstName", "healthScore", "id", "imapHost", "imapPass", "imapPort", "imapUser", "lastActive", "lastName", "lastSyncedAt", "minWaitTime", "provider", "sentToday", "signature", "slowRamp", "smtpHost", "smtpPass", "smtpPort", "smtpUser", "status", "updatedAt", "userId", "warmupCurrentDay", "warmupDailyIncrease", "warmupDailyLimit", "warmupEnabled", "warmupMaxPerDay", "warmupPoolOptIn", "warmupRepliedToday", "warmupReplyRate", "warmupScore", "warmupSentToday", "warmupTag") SELECT "bounceCount", "createdAt", "dailyLimit", "email", "errorDetail", "firstName", "healthScore", "id", "imapHost", "imapPass", "imapPort", "imapUser", "lastActive", "lastName", "lastSyncedAt", "minWaitTime", "provider", "sentToday", "signature", "slowRamp", "smtpHost", "smtpPass", "smtpPort", "smtpUser", "status", "updatedAt", "userId", "warmupCurrentDay", "warmupDailyIncrease", "warmupDailyLimit", "warmupEnabled", "warmupMaxPerDay", "warmupPoolOptIn", "warmupRepliedToday", "warmupReplyRate", "warmupScore", "warmupSentToday", "warmupTag" FROM "EmailAccount";
DROP TABLE "EmailAccount";
ALTER TABLE "new_EmailAccount" RENAME TO "EmailAccount";
CREATE UNIQUE INDEX "EmailAccount_email_key" ON "EmailAccount"("email");
CREATE TABLE "new_Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "message" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reminder_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reminder" ("createdAt", "id", "leadId", "message", "scheduledAt", "status", "updatedAt", "userId") SELECT "createdAt", "id", "leadId", "message", "scheduledAt", "status", "updatedAt", "userId" FROM "Reminder";
DROP TABLE "Reminder";
ALTER TABLE "new_Reminder" RENAME TO "Reminder";
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");
CREATE INDEX "Reminder_scheduledAt_idx" ON "Reminder"("scheduledAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorBackupCodes" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "planExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("email", "id", "name", "password", "plan", "planExpiresAt", "twoFactorBackupCodes", "twoFactorEnabled", "twoFactorSecret") SELECT "email", "id", "name", "password", "plan", "planExpiresAt", "twoFactorBackupCodes", "twoFactorEnabled", "twoFactorSecret" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
