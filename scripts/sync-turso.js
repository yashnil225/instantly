
const { createClient } = require("@libsql/client");

const url = "libsql://instantly-yashnil225.aws-ap-south-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjY4MjQ0NTksImlkIjoiY2VhMzA2MDktNTJmNS00OGJlLWIyNDAtZjdiNTZkZmJkYmExIiwicmlkIjoiYzdiMzI3ZGQtMDg4My00NzI3LThmOTItYmQ5Y2YzODAyY2YzIn0.nO4Ro7WKv-uskVDVxKz7qj_jNNJwbRycD8AaU-1dRWY1TdnTlqiR6LJ4R1nxHJbB4FMBdjGeDPs07ipOuBTsBQ";

const client = createClient({
  url,
  authToken,
});

async function main() {
  console.log("Connecting to Turso...");
  
  const columns = [
    "refreshToken TEXT",
    "accessToken TEXT", 
    "expiresAt BIGINT",
    "idToken TEXT",
    "scope TEXT"
  ];

  for (const col of columns) {
    try {
      const colName = col.split(" ")[0];
      console.log(`Adding column ${colName}...`);
      await client.execute(`ALTER TABLE EmailAccount ADD COLUMN ${col};`);
      console.log(`✅ Added ${colName}`);
    } catch (e) {
      if (e.message && e.message.includes("duplicate column")) {
        console.log(`⚠️ Column already exists (skipping)`);
      } else {
        console.error(`❌ Failed to add column:`, e);
      }
    }
  }

  console.log("Done syncing Turso!");
}

main();
