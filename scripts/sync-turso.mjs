import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// List of columns that might be missing in Turso compared to the current schema
const alterStatements = [
    // SendingEvent columns
    'ALTER TABLE SendingEvent ADD COLUMN details TEXT;',

    // EmailAccount columns for OAuth and Syncing
    'ALTER TABLE EmailAccount ADD COLUMN refreshToken TEXT;',
    'ALTER TABLE EmailAccount ADD COLUMN accessToken TEXT;',
    'ALTER TABLE EmailAccount ADD COLUMN expiresAt INTEGER;',
    'ALTER TABLE EmailAccount ADD COLUMN idToken TEXT;',
    'ALTER TABLE EmailAccount ADD COLUMN scope TEXT;',
    'ALTER TABLE EmailAccount ADD COLUMN lastSyncedAt DATETIME;',
    'ALTER TABLE EmailAccount ADD COLUMN bounceCount INTEGER DEFAULT 0;',
    'ALTER TABLE EmailAccount ADD COLUMN errorDetail TEXT;',
];

async function syncSchema() {
    console.log('Syncing Turso database schema...\n');

    for (const sql of alterStatements) {
        try {
            await client.execute(sql);
            console.log(`✅ ${sql}`);
        } catch (error) {
            if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
                const columnMatch = sql.match(/ADD COLUMN (\w+)/);
                const tableName = sql.match(/ALTER TABLE (\w+)/)?.[1];
                console.log(`⏭️  Table [${tableName}] already has column: ${columnMatch?.[1]}`);
            } else {
                console.log(`❌ Error: ${error.message}`);
            }
        }
    }

    // Verification checks
    console.log('\n--- Status Check ---');
    const tables = ['SendingEvent', 'EmailAccount'];
    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        const result = await client.execute(`PRAGMA table_info(${table});`);
        console.table(result.rows.map(r => ({ name: r.name, type: r.type })));
    }

    console.log('\n✅ Turso schema sync process finished.');
}

syncSchema().catch(console.error);
