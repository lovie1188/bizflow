require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(
  "UPDATE companies SET custom_domain='charu.local' WHERE name='Charu Marketing' RETURNING id, name, custom_domain"
).then(r => {
  console.log('✅ Custom domain updated:', r.rows);
  process.exit(0);
}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
