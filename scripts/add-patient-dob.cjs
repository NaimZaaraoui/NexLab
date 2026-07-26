const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const clientConfig = {
  url,
};

if (process.env.DATABASE_ENCRYPTION_KEY) {
  clientConfig.encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
}

const client = createClient(clientConfig);

async function main() {
  // Check if column exists
  const info = await client.execute('PRAGMA table_info(analyses)');
  const exists = info.rows.some((row) => row[1] === 'patientDOB');

  if (exists) {
    console.log('Column patientDOB already exists, nothing to do.');
    return;
  }

  await client.execute('ALTER TABLE analyses ADD COLUMN patientDOB DATETIME;');
  console.log('Column patientDOB added successfully to analyses table.');
}

main().catch((e) => { console.error(e); process.exit(1); });
