// backend/src/scripts/resetPasswords.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../utils/db');

(async () => {
  try {
    const targetPassword = 'password123';
    const hash = await bcrypt.hash(targetPassword, 10);

    const res = await pool.query('UPDATE users SET password_hash = $1 RETURNING id, email, role', [hash]);
    console.log(`\n✅ Successfully updated all ${res.rows.length} users with password: "${targetPassword}"\n`);
    res.rows.forEach(u => {
      console.log(`- ${u.role.toUpperCase()}: ${u.email} -> password: ${targetPassword}`);
    });
  } catch (err) {
    console.error('Password reset failed:', err);
  } finally {
    await pool.end();
  }
})();
