/**
 * BizFlow — Shared PostgreSQL Connection Pool
 *
 * All routes should import this single pool instead of creating new Pool()
 * in every file. This prevents connection exhaustion on Neon's limited
 * connection quota.
 *
 * Usage:
 *   const pool = require('../utils/db');
 *   const result = await pool.query('SELECT ...', [...]);
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon-friendly: keep idle connections short to stay within connection limits
  max: 10,                // max 10 simultaneous connections
  idleTimeoutMillis: 30000,  // release idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // fail fast if no connection available within 5s
});

pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err.message);
});

module.exports = pool;
