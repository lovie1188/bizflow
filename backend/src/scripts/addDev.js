const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  // M-10: Use SEED_PASSWORD env var instead of hardcoded weak password
  const devPassword = process.env.SEED_PASSWORD || 'BizFlow@Dev2026!';
  if (!process.env.SEED_PASSWORD) {
    console.warn('[addDev WARNING] SEED_PASSWORD not set — using default dev password.');
  }
  try {
    const hash = await bcrypt.hash(devPassword, 10);
    await pool.query('INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, $5)', ['Developer', 'dev@bizflow.in', hash, 'developer', true]);
    console.log('Dev user added: dev@bizflow.in');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();
