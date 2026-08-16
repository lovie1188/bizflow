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

const isRemoteDb = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('sslmode=require'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // 15s to allow Neon serverless wake-up
});

pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err.message);
});

module.exports = pool;
