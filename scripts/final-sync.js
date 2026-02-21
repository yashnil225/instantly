const https = require('https');

const TURSO_URL = 'instantly-yashnil225.aws-ap-south-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjY4MjQ0NTksImlkIjoiY2VhMzA2MDktNTJmNS00OGJlLWIyNDAtZjdiNTZkZmJkYmExIiwicmlkIjoiYzdiMzI3ZGQtMDg4My00NzI3LThmOTItYmQ5Y2YzODAyY2YzIn0.nO4Ro7WKv-uskVDVxKz7qj_jNNJwbRycD8AaU-1dRWY1TdnTlqiR6LJ4R1nxHJbB4FMBdjGeDPs07ipOuBTsBQ';

function tursoQuery(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      requests: [{ type: "execute", stmt: { sql: sql } }]
    });

    const options = {
      hostname: TURSO_URL,
      path: '/v2/pipeline',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch (e) { resolve({ raw: responseData }); }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function finalSync() {
    console.log('🚀 Starting Final Turso Sync...\n');

    try {
        // 1. Sync Limits (Ensuring no nulls and keeping them independent)
        console.log('📊 Syncing limits and clearing OAuth...');
        const syncSql = `
            UPDATE EmailAccount SET 
                dailyLimit = COALESCE(dailyLimit, 300),
                warmupDailyLimit = COALESCE(warmupDailyLimit, 50),
                warmupMaxPerDay = COALESCE(warmupMaxPerDay, 50),
                refreshToken = NULL,
                accessToken = NULL,
                expiresAt = NULL,
                status = 'active',
                errorDetail = NULL
            WHERE status = 'error' OR refreshToken IS NOT NULL;
        `;
        await tursoQuery(syncSql);
        console.log('✅ Limits synced and auth cleared.');

        // 2. Fix IMAP Passwords
        console.log('🔑 Fixing IMAP passwords...');
        await tursoQuery(`UPDATE EmailAccount SET imapPass = smtpPass WHERE smtpPass IS NOT NULL AND (imapPass IS NULL OR imapPass = '')`);
        console.log('✅ IMAP passwords fixed.');

        // 3. Final Schema Check
        const tableInfo = await tursoQuery("PRAGMA table_info(EmailAccount)");
        const columns = tableInfo.results[0].response.result.rows.map(row => row[1].value);
        
        console.log('\n📱 Column check:');
        console.log('- trackingDomainEnabled:', columns.includes('trackingDomainEnabled') ? '✅' : '❌');
        console.log('- customDomain:', columns.includes('customDomain') ? '✅' : '❌');

        console.log('\n🎉 ALL SYSTEMS SYNCED!');

    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    }
}

finalSync();
