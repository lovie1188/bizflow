/**
 * BizFlow SaaS - Backend Server
 * Node.js + Express + PostgreSQL
 * Production-ready API for Web + Mobile
 */

// ============================================================
// DEPENDENCIES (install via npm)
// ============================================================
/*
npm init -y
npm install express cors dotenv pg jsonwebtoken bcryptjs axios socket.io helmet rate-limit
npm install --save-dev nodemon

Create .env file:
DATABASE_URL=postgresql://user:pass@localhost:5432/bizflow_saas
JWT_SECRET=your-secret-key-min-32-chars
PORT=5000
NODE_ENV=development
RAZORPAY_KEY=xxx
RAZORPAY_SECRET=xxx
*/

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

require('./utils/logger'); // Initialize logger to override console.error/warn
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./utils/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cron = require('node-cron');
const { performBackup } = require('./services/backupService');

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({
  // L-7: Explicit security headers
  noSniff: true,                           // X-Content-Type-Options: nosniff
  xssFilter: true,                         // X-XSS-Protection (legacy browsers)
  frameguard: { action: 'sameorigin' },    // X-Frame-Options: SAMEORIGIN
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' }, // Restore with safe value instead of false
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://api.razorpay.com", ...(process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean)],
      frameSrc: ["'self'", "https://api.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  }
}));
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// M-7: Support multiple allowed origins via comma-separated CORS_ORIGIN env var
// e.g., CORS_ORIGIN=https://app.bizflow.in,https://staging.bizflow.in
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // L-2: added PATCH for partial update endpoints
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' })); // L-8: Reduced from 10mb — 1MB is ample for all API payloads

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // M-4: Reduced from 2000 — 300 req/15min is still generous for legitimate use
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Auth middleware moved to src/middleware/auth.js

// ============================================================
// DATABASE INITIALIZATION
// ============================================================
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        gstin VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        plan VARCHAR(50) DEFAULT 'starter',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        stripe_customer_id VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'buyer',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Junction table for Multi-Company support
      CREATE TABLE IF NOT EXISTS user_companies (
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        company_id INT REFERENCES companies(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'admin',
        PRIMARY KEY (user_id, company_id)
      );

      CREATE TABLE IF NOT EXISTS buyers (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        name VARCHAR(255) NOT NULL,
        gstin VARCHAR(15),
        pan VARCHAR(10),
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        address TEXT,
        pincode VARCHAR(10),
        business_type VARCHAR(50),
        msme_no VARCHAR(50),
        msme_type VARCHAR(20),
        credit_limit DECIMAL(12,2) DEFAULT 50000,
        used_credit DECIMAL(12,2) DEFAULT 0,
        risk_score INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        agreement_signed BOOLEAN DEFAULT false,
        agreement_url VARCHAR(255),
        grace_period_days INT DEFAULT 0,
        grace_period_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        sku VARCHAR(50),
        name VARCHAR(255),
        hsn_code VARCHAR(10),
        gst_rate INT,
        unit VARCHAR(20),
        buy_price DECIMAL(10,2),
        trade_price DECIMAL(10,2),
        stock INT DEFAULT 0,
        min_order_qty INT DEFAULT 1,
        image_url VARCHAR(255),
        category VARCHAR(100) DEFAULT 'Other',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        order_number VARCHAR(50) UNIQUE,
        buyer_id INT REFERENCES users(id),
        buyer_entity_id INT REFERENCES buyers(id),
        total_amount DECIMAL(10,2),
        subtotal DECIMAL(12,2),
        gst_amount DECIMAL(12,2),
        grand_total DECIMAL(12,2),
        items_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        invoice_date DATE,
        due_date DATE,
        paid BOOLEAN DEFAULT false,
        dispatch_date DATE,
        vehicle_no VARCHAR(20),
        transporter VARCHAR(255),
        ewb_no VARCHAR(50),
        ewb_validity DATE,
        delivery_address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id),
        qty DECIMAL(10,3) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        gst_rate INT NOT NULL,
        hsn_code VARCHAR(10),
        amount DECIMAL(12,2),
        gst_amount DECIMAL(12,2),
        total DECIMAL(12,2)
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        order_id INT REFERENCES orders(id),
        buyer_entity_id INT REFERENCES buyers(id),
        invoice_number VARCHAR(50) UNIQUE,
        irn VARCHAR(32),
        irn_status VARCHAR(20) DEFAULT 'pending',
        irn_date DATE,
        qr_code TEXT,
        ewb_no VARCHAR(50),
        amount DECIMAL(12,2),
        due_date DATE,
        paid BOOLEAN DEFAULT false,
        payment_days INT DEFAULT 0,
        msme_protected BOOLEAN DEFAULT false,
        agreement_type VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        invoice_id INT REFERENCES invoices(id),
        amount DECIMAL(12,2),
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        account_name VARCHAR(100),
        bank_name VARCHAR(100),
        account_no VARCHAR(30),
        ifsc VARCHAR(15),
        upi_id VARCHAR(100),
        owner_name VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        invoice_id INT REFERENCES invoices(id),
        type VARCHAR(50),
        day_trigger INT,
        sent_at TIMESTAMP,
        status VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS consent_records (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        purpose VARCHAR(100),
        data_types TEXT,
        consent_given BOOLEAN,
        timestamp TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(45),
        version VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS company_subscriptions (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id) ON DELETE CASCADE,
        feature VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'inactive',
        activated_by INT REFERENCES users(id),
        activated_at TIMESTAMP,
        expires_at TIMESTAMP,
        price_monthly DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(company_id, feature)
      );

      -- Global feature flags (developer master switch)
      INSERT INTO system_settings (key, value) VALUES ('razorpay_globally_enabled', 'true')  ON CONFLICT (key) DO NOTHING;
      INSERT INTO system_settings (key, value) VALUES ('whatsapp_globally_enabled',  'false') ON CONFLICT (key) DO NOTHING;
      INSERT INTO system_settings (key, value) VALUES ('sms_globally_enabled',       'false') ON CONFLICT (key) DO NOTHING;

      -- Monthly pricing (in INR)
      INSERT INTO system_settings (key, value) VALUES ('feature_price_razorpay',  '999') ON CONFLICT (key) DO NOTHING;
      INSERT INTO system_settings (key, value) VALUES ('feature_price_whatsapp',  '499') ON CONFLICT (key) DO NOTHING;
      INSERT INTO system_settings (key, value) VALUES ('feature_price_sms',       '299') ON CONFLICT (key) DO NOTHING;

      -- Feature descriptions
      INSERT INTO system_settings (key, value) VALUES ('feature_desc_razorpay',  'Accept online payments from buyers via UPI, cards, net banking & wallets through Razorpay secure gateway.') ON CONFLICT (key) DO NOTHING;
      INSERT INTO system_settings (key, value) VALUES ('feature_desc_whatsapp',  'Send automated invoice reminders, payment receipts and due-date alerts to buyers via WhatsApp Business API.') ON CONFLICT (key) DO NOTHING;
      INSERT INTO system_settings (key, value) VALUES ('feature_desc_sms',       'Send SMS alerts for invoice generation, payment confirmations and overdue reminders to buyers mobile numbers.') ON CONFLICT (key) DO NOTHING;


      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        action VARCHAR(100),
        entity_type VARCHAR(50),
        entity_id INT,
        changes JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- ── Feature Catalog: master list, shared across all clients ──────
      CREATE TABLE IF NOT EXISTS feature_catalog (
        id                     SERIAL PRIMARY KEY,
        key                    VARCHAR(50) UNIQUE NOT NULL,
        name                   VARCHAR(100) NOT NULL,
        category               VARCHAR(20) NOT NULL DEFAULT 'feature',
        description            TEXT,
        default_hours          DECIMAL(6,1) DEFAULT 0,
        complexity             VARCHAR(10)  DEFAULT 'medium',
        hourly_rate            DECIMAL(8,2) DEFAULT 400,
        billing_type           VARCHAR(30)  DEFAULT 'one_time',
        recurring_monthly_cost DECIMAL(10,2) DEFAULT 0,
        gates_route            VARCHAR(255),
        display_order          INT DEFAULT 99,
        is_active              BOOLEAN DEFAULT true
      );

      -- ── Client Features: per-company toggles + override pricing ──────
      CREATE TABLE IF NOT EXISTS client_features (
        id             SERIAL PRIMARY KEY,
        company_id     INT REFERENCES companies(id) ON DELETE CASCADE,
        feature_key    VARCHAR(50) NOT NULL,
        enabled        BOOLEAN DEFAULT true,
        override_price DECIMAL(10,2),
        billing_status VARCHAR(20) DEFAULT 'charged',
        notes          TEXT,
        updated_at     TIMESTAMP DEFAULT NOW(),
        updated_by     INT REFERENCES users(id),
        UNIQUE(company_id, feature_key)
      );

      -- ── Feature Catalog seed data ─────────────────────────────────────
      INSERT INTO feature_catalog
        (key, name, category, description, default_hours, complexity, hourly_rate, billing_type, recurring_monthly_cost, display_order)
      VALUES
        ('auth_roles',       'Auth + Role-based Login',         'feature',        'Admin, Buyer, Delivery, Developer roles with JWT',                 10,  'medium',  400, 'one_time',                  0,   1),
        ('product_catalog',  'Product Catalog + Search',        'feature',        'Browse, filter, search products with categories',                   8,  'simple',  400, 'one_time',                  0,   2),
        ('cart_checkout',    'Cart + Checkout Flow',            'feature',        'Add to cart, T&C digital sign, place order',                       12,  'medium',  400, 'one_time',                  0,   3),
        ('gst_invoicing',    'GST-Compliant Invoicing',         'feature',        'CGST/SGST/IGST line-item split, Tax Invoice HTML',                 15,  'complex', 400, 'one_time',                  0,   4),
        ('po_pdf',           'Purchase Order PDF',              'feature',        'Auto-generated PO HTML on every order',                             6,  'medium',  400, 'one_time',                  0,   5),
        ('msme_compliance',  'MSME 45-day Compliance Engine',   'feature',        'Aging buckets, 19.5% interest calc, Section 43B(h) alerts',        10,  'complex', 400, 'one_time',                  0,   6),
        ('credit_limit',     'Credit Limit Management',         'feature',        'Per-buyer credit tracking, enforcement, release on payment',         8,  'medium',  400, 'one_time',                  0,   7),
        ('delivery_track',   'Delivery Tracking Dashboard',     'feature',        'Staff dispatch/delivered status with tracking timeline',             8,  'medium',  400, 'one_time',                  0,   8),
        ('admin_settings',   'Admin Settings + Bank Accounts',  'feature',        'Company profile, GSTIN, bank CRUD, compliance settings',            5,  'simple',  400, 'one_time',                  0,   9),
        ('buyer_onboard',    'Buyer Registration + Approval',   'feature',        'Self-register, MSME agreement upload, grace period, IDOR checks',   8,  'medium',  400, 'one_time',                  0,  10),
        ('audit_dpdp',       'Audit Logs + DPDP Consent',       'feature',        'DPDP Act consent records, system-wide audit trail',                 8,  'medium',  400, 'one_time',                  0,  11),
        ('developer_dash',   'Developer Dashboard',             'feature',        'Backups, export, subscriptions, feature flags, system logs',        12,  'complex', 400, 'one_time',                  0,  12),
        ('razorpay',         'Razorpay Payment Gateway',        'infrastructure', 'Online payments via UPI/cards/netbanking/wallets',                  10,  'complex', 400, 'recurring_monthly',        999,  13),
        ('hosting_backend',  'Backend Hosting (Render)',        'infrastructure', 'Node.js API server — free tier to start',                            0,  'simple',  0,   'recurring_monthly',          0,  14),
        ('hosting_frontend', 'Frontend Hosting (Vercel)',       'infrastructure', 'React static site — free tier',                                      0,  'simple',  0,   'recurring_monthly',          0,  15),
        ('database_neon',    'Database (Neon PostgreSQL)',      'infrastructure', 'Managed cloud PostgreSQL — free tier',                               0,  'simple',  0,   'recurring_monthly',          0,  16),
        ('domain_ssl',       'Domain + SSL Certificate',       'infrastructure', 'Annual domain renewal (.in domain)',                                  0,  'simple',  0,   'recurring_yearly',         800,  17),
        ('google_drive',     'Google Drive Storage',           'infrastructure', 'Agreement and document file storage',                                6,  'medium',  400, 'recurring_monthly',          0,  18),
        ('email_sendgrid',   'Email Notifications (SendGrid)', 'infrastructure', 'Transactional email — free tier 100/day',                            6,  'medium',  400, 'recurring_monthly',          0,  19),
        ('whatsapp_notif',   'WhatsApp Notifications',         'infrastructure', 'WhatsApp Business API alerts for invoices/reminders',                6,  'medium',  400, 'recurring_monthly',        499,  20),
        ('sms_alerts',       'SMS Alerts',                    'infrastructure', 'SMS for invoice/payment/overdue notifications',                       4,  'simple',  400, 'recurring_monthly',        299,  21),
        ('razorpay_txn_fee', 'Razorpay Transaction Fee',      'infrastructure', '~2% per transaction — passed through at cost',                       0,  'simple',  0,   'percentage_per_transaction', 0,  22),
        ('amc',              'Annual Maintenance Contract',   'maintenance',    '18% of one-time build cost — bug fixes, security patches, 2 hrs/month support', 0, 'simple', 0, 'recurring_yearly', 0, 23)
      ON CONFLICT (key) DO NOTHING;

      CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id);
      CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
      CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_paid_company ON invoices(paid, company_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
};

// Initialize Database
initDB();

// ============================================================
// MIGRATIONS (safe, idempotent - add new columns to existing DBs)
// ============================================================
const runMigrations = async () => {
  try {
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Other'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100)`);
    
    // Add used_credit to buyers
    await pool.query(`ALTER TABLE buyers ADD COLUMN IF NOT EXISTS used_credit DECIMAL(12,2) DEFAULT 0`);
    
    // Add columns for invoices GST split
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(12,2)`);
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12,2)`);

    // Add updated_at to companies
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    
    // Delivery & Documentation columns for orders
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tc_accepted_at TIMESTAMP`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tc_signature TEXT`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS po_url VARCHAR(255)`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url VARCHAR(255)`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending'`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_tracking JSONB DEFAULT '[]'::jsonb`);
    
    // Agreement upload column for buyers
    await pool.query(`ALTER TABLE buyers ADD COLUMN IF NOT EXISTS agreement_uploaded_at TIMESTAMP`);

    // Company settings
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV-2026-'`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS udyam_no VARCHAR(100)`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS state VARCHAR(100)`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS gst_turnover VARCHAR(100) DEFAULT 'Below ₹5 Crore — IRP not mandatory'`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_payment_terms VARCHAR(100) DEFAULT '15 Days (No agreement)'`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS eway_bill_threshold VARCHAR(100) DEFAULT '₹50,000 (Mandatory)'`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS msme_alert_days VARCHAR(100) DEFAULT '45 Days — MSME Protected'`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE buyers   ADD COLUMN IF NOT EXISTS msme_no VARCHAR(100)`);

    console.log('Migrations applied');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
};
runMigrations();

// ============================================================
// STATIC FILES (UPLOADS)
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================
// API ROUTES
// ============================================================
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const invoicesRoutes = require('./routes/invoices');
const buyersRoutes = require('./routes/buyers');
const paymentsRoutes = require('./routes/payments');
const companiesRoutes = require('./routes/companies');
const usersRoutes = require('./routes/users');
const developerRoutes = require('./routes/developer');
const auditLogsRoutes = require('./routes/auditLogs');
const consentRoutes = require('./routes/consentRecords');
const notificationsRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const subscriptionsRoutes = require('./routes/subscriptions');
const exportRoutes = require('./routes/export'); // NEW
const publicRoutes = require('./routes/public');
const featureCatalogRoutes = require('./routes/featureCatalog');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/buyers', buyersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/developer', exportRoutes); // export routes: /api/developer/export, /api/developer/export/check
app.use('/api/public', publicRoutes);
app.use('/api/features', featureCatalogRoutes); // costing + feature toggle module

// ============================================================
// CRON JOBS
// ============================================================
// Schedule DB backup every day at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
  console.log('Cron Job: Running daily auto-backup...');
  try {
    await performBackup();
  } catch (error) {
    console.error('Cron Job: Backup failed:', error.message);
  }
});

// Schedule MSME 45-Day overdue reminders — daily at 8 AM IST
const { scheduleOverdueReminders } = require('./jobs/overdueReminder');
scheduleOverdueReminders();

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================================
// 404 — Unknown API Routes (must be BEFORE global error handler)
// ============================================================
app.use('/api', (req, res, next) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ============================================================
// GLOBAL ERROR HANDLER (M-5: Never expose raw DB errors to clients)
// ============================================================
app.use((err, req, res, next) => {
  // Always log the full error server-side for debugging
  console.error(`[Error] ${req.method} ${req.url} — ${err.message}`, err.stack);

  const status = err.status || err.statusCode || 500;

  // In development, expose full details to aid debugging
  if (process.env.NODE_ENV === 'development') {
    return res.status(status).json({
      success: false,
      message: err.message || 'Internal Server Error',
      stack: err.stack
    });
  }

  // In production: only expose message for client-safe errors (4xx).
  // For 5xx, return a generic message to avoid leaking DB internals.
  const isSafeError = status >= 400 && status < 500;
  res.status(status).json({
    success: false,
    message: isSafeError
      ? (err.message || 'Bad request')
      : 'An internal server error occurred. Please try again or contact support.'
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BizFlow API Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
