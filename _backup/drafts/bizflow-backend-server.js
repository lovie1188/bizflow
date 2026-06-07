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
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.companyId = decoded.companyId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

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
        company_id INT REFERENCES companies(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'buyer',
        active BOOLEAN DEFAULT true,
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
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        order_number VARCHAR(50) UNIQUE,
        buyer_id INT REFERENCES users(id),
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        invoice_date DATE,
        due_date DATE,
        paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        order_id INT REFERENCES orders(id),
        invoice_number VARCHAR(50) UNIQUE,
        irn VARCHAR(32),
        amount DECIMAL(10,2),
        due_date DATE,
        paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(id),
        invoice_id INT REFERENCES invoices(id),
        amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_company_id ON users(company_id);
      CREATE INDEX IF NOT EXISTS idx_company_id_products ON products(company_id);
      CREATE INDEX IF NOT EXISTS idx_company_id_orders ON orders(company_id);
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
};

initDB();

// ============================================================
// API ENDPOINTS
// ============================================================

// REGISTER NEW COMPANY
app.post('/api/auth/register', async (req, res) => {
  const { companyName, gstin, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const companyResult = await pool.query(
      'INSERT INTO companies (name, gstin) VALUES ($1, $2) RETURNING id',
      [companyName, gstin]
    );
    const companyId = companyResult.rows[0].id;

    const userResult = await pool.query(
      'INSERT INTO users (company_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [companyId, companyName, email, hashedPassword, 'admin']
    );

    const token = jwt.sign(
      { userId: userResult.rows[0].id, role: 'admin', companyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token, 
      company: { id: companyId, name: companyName, gstin },
      message: 'Company registered successfully'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const userResult = await pool.query(
      'SELECT u.*, c.id as company_id FROM users u JOIN companies c ON u.company_id = c.id WHERE u.email = $1',
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

    const token = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: user.company_id }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET DASHBOARD DATA
app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE company_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.companyId]
    );

    const invoicesResult = await pool.query(
      'SELECT * FROM invoices WHERE company_id = $1 AND paid = false',
      [req.companyId]
    );

    const totalOutstanding = invoicesResult.rows.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    res.json({
      orders: ordersResult.rows,
      invoices: invoicesResult.rows,
      totalOutstanding,
      unpaidCount: invoicesResult.rows.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE PRODUCT
app.post('/api/products', verifyToken, async (req, res) => {
  const { sku, name, hsnCode, gstRate, unit, buyPrice, tradePrice } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO products (company_id, sku, name, hsn_code, gst_rate, unit, buy_price, trade_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.companyId, sku, name, hsnCode, gstRate, unit, buyPrice, tradePrice]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET PRODUCTS
app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE company_id = $1 ORDER BY created_at DESC',
      [req.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE ORDER
app.post('/api/orders', verifyToken, async (req, res) => {
  const { buyerId, items, totalAmount, dueDate } = req.body;
  
  try {
    const orderNumber = `ORD-${Date.now()}`;
    const result = await pool.query(
      'INSERT INTO orders (company_id, order_number, buyer_id, total_amount, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.companyId, orderNumber, buyerId, totalAmount, dueDate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET ORDERS
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const query = req.role === 'admin'
      ? 'SELECT o.*, u.name as buyer_name FROM orders o LEFT JOIN users u ON o.buyer_id = u.id WHERE o.company_id = $1 ORDER BY o.created_at DESC'
      : 'SELECT o.*, u.name as buyer_name FROM orders o LEFT JOIN users u ON o.buyer_id = u.id WHERE o.company_id = $1 AND o.buyer_id = $2 ORDER BY o.created_at DESC';
    
    const params = req.role === 'admin' ? [req.companyId] : [req.companyId, req.userId];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE INVOICE
app.post('/api/invoices', verifyToken, async (req, res) => {
  const { orderId, amount, dueDate } = req.body;
  
  try {
    const invoiceNumber = `INV-${Date.now()}`;
    const irn = Math.random().toString(36).substring(2, 34).toUpperCase();
    
    const result = await pool.query(
      'INSERT INTO invoices (company_id, order_id, invoice_number, irn, amount, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.companyId, orderId, invoiceNumber, irn, amount, dueDate]
    );

    // Update order status
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['dispatched', orderId]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET INVOICES
app.get('/api/invoices', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT i.*, o.order_number FROM invoices i LEFT JOIN orders o ON i.order_id = o.id WHERE i.company_id = $1 ORDER BY i.created_at DESC',
      [req.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK INVOICE AS PAID
app.post('/api/invoices/:id/mark-paid', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE invoices SET paid = true WHERE id = $1 AND company_id = $2 RETURNING *',
      [req.params.id, req.companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PAYMENT WEBHOOK (Razorpay)
app.post('/api/payments/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const crypto = require('crypto');
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body.toString();

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body)
    .digest('hex');

  if (signature === expectedSignature) {
    const { payload } = JSON.parse(body);
    const invoiceId = payload.payment.entity.notes.invoice_id;
    
    try {
      await pool.query(
        'UPDATE invoices SET paid = true WHERE id = $1',
        [invoiceId]
      );
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});

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
