const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function sync() {
  console.log("🚀 Starting Turso sync (JS version)...");

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
    } catch (error) {
      if (error.message.includes("duplicate column name") || error.message.includes("already exists")) {
        console.log(`ℹ️ Column ${column.name} already exists. Skipping.`);
      } else {
        console.warn(`⚠️ Error adding column ${column.name}: ${error.message}`);
      }
    }
  }

  console.log("🏁 Sync completed.");
}

sync().catch(console.error);
