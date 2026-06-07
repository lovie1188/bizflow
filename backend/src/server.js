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
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({ crossOriginResourcePolicy: false }));

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: 'Too many requests, please try again later.'
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

    console.log('Migrations applied');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
};
runMigrations();

// ============================================================
// STATIC FILES (UPLOADS)
// ============================================================
const path = require('path');
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

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/buyers', buyersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
