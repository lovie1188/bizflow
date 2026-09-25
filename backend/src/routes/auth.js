const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/audit');
const rateLimit = require('express-rate-limit');


// ── Rate Limiter: 10 attempts per 15 minutes per IP on auth routes ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// REGISTER NEW COMPANY (Rate Limited)
router.post('/register', authLimiter, async (req, res) => {
  const { companyName, gstin, email, password } = req.body;

  // Validate required fields
  if (!companyName || !gstin || !email || !password) {
    return res.status(400).json({ error: 'companyName, gstin, email, and password are required.' });
  }
  // Validate GSTIN format: 15-char alphanumeric per Indian GST rules
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin)) {
    return res.status(400).json({ error: 'Invalid GSTIN format. Must be 15 characters (e.g., 29ABCDE1234F1Z5).' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Start transaction
    await pool.query('BEGIN');


    const companyResult = await pool.query(
      'INSERT INTO companies (name, gstin) VALUES ($1, $2) RETURNING id',
      [companyName, gstin]
    );
    const companyId = companyResult.rows[0].id;

    const userResult = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [companyName, email, hashedPassword, 'admin']
    );
    const userId = userResult.rows[0].id;

    await pool.query(
      'INSERT INTO user_companies (user_id, company_id, role) VALUES ($1, $2, $3)',
      [userId, companyId, 'admin']
    );

    await pool.query('COMMIT');

    const token = jwt.sign(
      { userId, role: 'admin', companyId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN_ADMIN || '7d' } // L-1: shorter expiry for privileged roles
    );
    
    // Explicitly attach userId to req for logging
    req.userId = userId;
    await logAudit(req, 'Company Registered', 'Company', companyId, { companyName, email });

    res.json({ 
      success: true, 
      token, 
      company: { id: companyId, name: companyName, gstin },
      message: 'Company registered successfully'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// REGISTER NEW BUYER (Rate Limited)
router.post('/register-buyer', authLimiter, async (req, res) => {
  const { businessName, gstin, phone, address, email, password, companyId } = req.body;

  // H-9: Password complexity enforcement
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one letter and one number.' });
  }

  try {
    let supplierId = companyId;
    if (!supplierId) {
      const activeCompanyRes = await pool.query('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
      supplierId = activeCompanyRes.rows.length > 0 ? activeCompanyRes.rows[0].id : 1;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Start transaction
    await pool.query('BEGIN');

    // Create the buyer user account
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [businessName, email, hashedPassword, 'buyer']
    );
    const userId = userResult.rows[0].id;

    // Create the buyer entity linked to the supplier
    const buyerResult = await pool.query(
      'INSERT INTO buyers (company_id, name, gstin, phone, email, address, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [supplierId, businessName, gstin, phone, email, address, 'pending']
    );
    const buyerEntityId = buyerResult.rows[0].id;

    await pool.query('COMMIT');

    const token = jwt.sign(
      { userId, role: 'buyer', companyId: supplierId, buyerEntityId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN_BUYER || '14d' } // L-1: buyers get longer session for UX
    );

    res.json({ 
      success: true, 
      token, 
      user: { id: userId, name: businessName, role: 'buyer' },
      buyerEntity: { id: buyerEntityId, status: 'pending' },
      message: 'Buyer registered successfully'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// LOGIN (Rate Limited)
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const userResult = await pool.query(
      'SELECT u.*, uc.company_id, uc.role as company_role FROM users u LEFT JOIN user_companies uc ON u.id = uc.user_id WHERE u.email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let buyerEntityId = null;
    let buyerStatus = null;
    if (user.role === 'buyer') {
      const buyerRes = await pool.query('SELECT id, status FROM buyers WHERE email = $1', [user.email]);
      if (buyerRes.rows.length > 0) {
        buyerEntityId = buyerRes.rows[0].id;
        buyerStatus = buyerRes.rows[0].status;
      }
    }

    // Fetch full company details for admin/supplier users
    let companyData = null;
    if (user.company_id) {
      const companyRes = await pool.query(
        'SELECT id, name, gstin, email, phone, address, city, state, pincode, invoice_prefix, plan, active FROM companies WHERE id = $1',
        [user.company_id]
      );
      if (companyRes.rows.length > 0) {
        companyData = companyRes.rows[0];
      }
    }

    const isBuyer = (user.company_role || user.role) === 'buyer';
    const token = jwt.sign(
      { userId: user.id, role: user.company_role || user.role, companyId: user.company_id, buyerEntityId },
      process.env.JWT_SECRET,
      // L-1: Role-aware expiry — buyers get longer session; admins/staff shorter for security
      { expiresIn: isBuyer
          ? (process.env.JWT_EXPIRES_IN_BUYER || '14d')
          : (process.env.JWT_EXPIRES_IN_ADMIN || '7d') }
    );
    
    req.userId = user.id;
    await logAudit(req, 'User Login', 'User', user.id, { email, role: user.company_role || user.role });

    res.json({ 
      success: true, 
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.company_role || user.role },
      company: companyData,
      buyerEntity: buyerEntityId ? { id: buyerEntityId, status: buyerStatus } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/setup ─────────────────────────────────────────────
// Called by frontend AuthContext.completeSetup() after first login.
// Updates company profile (address, phone, invoice_prefix etc.) and marks setup_complete.
const { verifyToken } = require('../middleware/auth');
router.post('/setup', verifyToken, async (req, res) => {
  try {
    const { companyName, gstin, phone, address, city, state, pincode, invoicePrefix } = req.body;
    const result = await pool.query(
      `UPDATE companies SET
        name            = COALESCE($1, name),
        gstin           = COALESCE($2, gstin),
        phone           = COALESCE($3, phone),
        address         = COALESCE($4, address),
        city            = COALESCE($5, city),
        state           = COALESCE($6, state),
        pincode         = COALESCE($7, pincode),
        invoice_prefix  = COALESCE($8, invoice_prefix),
        setup_complete  = true
       WHERE id = $9 RETURNING *`,
      [companyName, gstin, phone, address, city, state, pincode, invoicePrefix, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Company not found' });
    await logAudit(req, 'Company Setup Complete', 'Company', req.companyId, { companyName });
    res.json({ success: true, company: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────
// H-3: Revoke JWT token and record audit trail
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { revokeToken } = require('../utils/tokenBlacklist');
    if (req.token) {
      revokeToken(req.token);
    }
    await logAudit(req, 'User Logout', 'User', req.userId, {});
    res.json({ success: true, message: 'Logged out successfully. Token invalidated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── GET /auth/verify ──────────────────────────────────────────────────────
// Lightweight token check called by frontend on startup.
// Returns 200 if the JWT is valid, 401 if expired/invalid.
// Used to silently clear stale localStorage sessions without a full login.
const { verifyToken: verifyTokenMiddleware } = require('../middleware/auth');
router.get('/verify', verifyTokenMiddleware, (req, res) => {
  res.json({ valid: true, userId: req.userId, role: req.role });
});

// ── POST /auth/forgot-password ────────────────────────────────────────────
// Accepts email, generates a 1-hour reset token, sends it via email.
// Always returns 200 to prevent email enumeration.
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const userRes = await pool.query('SELECT id, name, email FROM users WHERE email = $1 AND active = true', [email]);

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      const crypto = require('crypto');
      const token  = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in password_reset_tokens table (created by migration below)
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, used = false`,
        [user.id, token, expiry]
      );

      // Send email — gracefully skip if SMTP is not configured
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
          port:   parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink   = `${frontendUrl}/reset-password?token=${token}`;

        await transporter.sendMail({
          from:    `"${process.env.EMAIL_FROM_NAME || 'BizFlow'}" <${process.env.EMAIL_USER}>`,
          to:      user.email,
          subject: 'BizFlow — Reset Your Password',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2>Password Reset Request</h2>
              <p>Hi ${user.name},</p>
              <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
              <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#02B290;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0">Reset Password</a>
              <p style="color:#666;font-size:13px">If you didn't request this, ignore this email. Your password won't change.</p>
              <p style="color:#666;font-size:12px">Link: ${resetLink}</p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Log email failure but don't expose to client
        console.error('[forgot-password] Email send failed:', emailErr.message);
      }
    }

    // Always return success — prevents email enumeration
    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgot-password] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// ── POST /auth/reset-password ─────────────────────────────────────────────
// Accepts token + new password, validates token, updates password.
router.post('/reset-password', authLimiter, async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const tokenRes = await pool.query(
      `SELECT prt.*, u.id AS uid FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    const { uid } = tokenRes.rows[0];
    const hashed  = await bcrypt.hash(password, 10);

    await pool.query('BEGIN');
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, uid]);
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);
    await pool.query('COMMIT');

    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('[reset-password] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

module.exports = router;
