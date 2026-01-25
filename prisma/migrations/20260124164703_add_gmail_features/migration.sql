-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "nextSendAt" DATETIME,
    "aiLabel" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "snoozedUntil" DATETIME,
    "unsubscribeToken" TEXT,
    "customFields" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "campaignId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("aiLabel", "campaignId", "company", "createdAt", "customFields", "email", "firstName", "id", "isRead", "lastName", "nextSendAt", "phone", "score", "status", "unsubscribeToken", "updatedAt", "website") SELECT "aiLabel", "campaignId", "company", "createdAt", "customFields", "email", "firstName", "id", "isRead", "lastName", "nextSendAt", "phone", "score", "status", "unsubscribeToken", "updatedAt", "website" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE UNIQUE INDEX "Lead_unsubscribeToken_key" ON "Lead"("unsubscribeToken");
CREATE UNIQUE INDEX "Lead_email_campaignId_key" ON "Lead"("email", "campaignId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
