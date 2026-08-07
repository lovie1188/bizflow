const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    const hash = await bcrypt.hash('password123', 10);
    await pool.query('INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, $5)', ['Developer', 'dev@bizflow.in', hash, 'developer', true]);
    console.log('Dev user added');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();
