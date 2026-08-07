const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    
    // 1. Wipe Existing Data
    console.log('Wiping existing data (Truncate Cascade)...');
    await pool.query(`
      TRUNCATE TABLE 
        order_items, 
        orders, 
        products, 
        buyers, 
        user_companies, 
        users, 
        companies 
      RESTART IDENTITY CASCADE;
    `);

    // 2. Create Supplier/Admin Company
    console.log('Seeding Admin Company...');
    const companyRes = await pool.query(`
      INSERT INTO companies (name, gstin, email, phone, plan, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['Charu Marketing', '08AWPSB0932G1ZM', 'admin@charumarketing.com', '9876543210', 'enterprise', true]);
    const adminCompanyId = companyRes.rows[0].id;

    // 3. Create Admin User
    const adminPassHash = await bcrypt.hash('password123', 10);
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['System Admin', 'admin@bizflow.com', adminPassHash, 'admin', true]);
    const adminUserId = userRes.rows[0].id;

    await pool.query(`
      INSERT INTO user_companies (user_id, company_id, role)
      VALUES ($1, $2, $3)
    `, [adminUserId, adminCompanyId, 'admin']);

    // 4. Create Dummy Products
    console.log('Seeding Products...');
    const products = [
      { sku: 'RM-001', name: 'Industrial Grade Steel Sheet 5mm', category: 'Raw Materials', hsn: '7208', rate: 18, unit: 'kg', buy: 45.00, trade: 55.00, stock: 5000 },
      { sku: 'RM-002', name: 'Aluminium Extrusion Profiles', category: 'Raw Materials', hsn: '7604', rate: 18, unit: 'kg', buy: 180.00, trade: 210.00, stock: 2000 },
      { sku: 'PK-101', name: 'Heavy Duty Corrugated Box (50x50x50)', category: 'Packaging', hsn: '4819', rate: 12, unit: 'pcs', buy: 25.00, trade: 32.00, stock: 10000 },
      { sku: 'PK-102', name: 'Bubble Wrap Roll (100m)', category: 'Packaging', hsn: '3923', rate: 18, unit: 'roll', buy: 400.00, trade: 550.00, stock: 300 },
      { sku: 'MC-501', name: 'CNC Router Bit 1/4"', category: 'Machinery Parts', hsn: '8207', rate: 18, unit: 'pcs', buy: 1200.00, trade: 1500.00, stock: 50 },
      { sku: 'MC-502', name: 'Stepper Motor NEMA 23', category: 'Machinery Parts', hsn: '8501', rate: 18, unit: 'pcs', buy: 2500.00, trade: 3200.00, stock: 150 },
      { sku: 'EL-201', name: 'Industrial PVC Cable (100m roll)', category: 'Electricals', hsn: '8544', rate: 18, unit: 'roll', buy: 1800.00, trade: 2200.00, stock: 100 },
      { sku: 'CH-301', name: 'Industrial Lubricant Grade A', category: 'Chemicals', hsn: '2710', rate: 18, unit: 'Ltr', buy: 350.00, trade: 420.00, stock: 800 },
      { sku: 'TL-801', name: 'Torque Wrench Set', category: 'Tools', hsn: '8204', rate: 18, unit: 'set', buy: 1500.00, trade: 1950.00, stock: 40 },
      { sku: 'SF-901', name: 'Safety Goggles UV Protect', category: 'Safety Gear', hsn: '9004', rate: 12, unit: 'pcs', buy: 120.00, trade: 180.00, stock: 1000 }
    ];

    const productIds = [];
    for (const p of products) {
      const prodRes = await pool.query(`
        INSERT INTO products (company_id, sku, name, category, hsn_code, gst_rate, unit, buy_price, trade_price, stock, min_order_qty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [adminCompanyId, p.sku, p.name, p.category, p.hsn, p.rate, p.unit, p.buy, p.trade, p.stock, 1]);
      productIds.push(prodRes.rows[0].id);
    }

    // 5. Create Buyer Entities
    console.log('Seeding Buyers...');
    const buyer1Res = await pool.query(`
      INSERT INTO buyers (company_id, name, gstin, phone, email, city, state, address, pincode, business_type, credit_limit, status, agreement_signed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [adminCompanyId, 'Acme Corp Industries', '27AAPCA1234K1Z1', '9000000001', 'purchase@acmecorp.com', 'Mumbai', 'Maharashtra', '101, Industrial Estate, Andheri', '400093', 'manufacturing', 500000, 'approved', true]);
    const buyer1Id = buyer1Res.rows[0].id;

    const buyer2Res = await pool.query(`
      INSERT INTO buyers (company_id, name, gstin, phone, email, city, state, address, pincode, business_type, credit_limit, status, agreement_signed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [adminCompanyId, 'TechMec Pvt Ltd', '07BBPCT5678L1Z2', '9000000002', 'procurement@techmec.com', 'New Delhi', 'Delhi', 'Phase 1, Okhla Industrial Area', '110020', 'trading', 200000, 'approved', true]);
    const buyer2Id = buyer2Res.rows[0].id;

    // 6. Create Buyer Users
    const buyerPassHash = await bcrypt.hash('password123', 10);
    
    // Buyer User 1
    const userB1Res = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['Acme Purchase Mgr', 'buyer1@acmecorp.com', buyerPassHash, 'buyer', true]);
    await pool.query(`
      INSERT INTO user_companies (user_id, company_id, role)
      VALUES ($1, $2, $3)
    `, [userB1Res.rows[0].id, adminCompanyId, 'buyer']);

    // Buyer User 2
    const userB2Res = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['TechMec Sourcing', 'buyer2@techmec.com', buyerPassHash, 'buyer', true]);
    await pool.query(`
      INSERT INTO user_companies (user_id, company_id, role)
      VALUES ($1, $2, $3)
    `, [userB2Res.rows[0].id, adminCompanyId, 'buyer']);

    // 7. Create Dummy Orders
    console.log('Seeding Orders...');
    // Order 1 (Acme Corp - Pending)
    const order1Res = await pool.query(`
      INSERT INTO orders (company_id, order_number, buyer_id, buyer_entity_id, total_amount, subtotal, gst_amount, grand_total, items_count, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - INTERVAL '2 DAYS')
      RETURNING id
    `, [adminCompanyId, 'ORD-2026-0001', userB1Res.rows[0].id, buyer1Id, 5500.00, 5500.00, 990.00, 6490.00, 1, 'pending']);
    
    await pool.query(`
      INSERT INTO order_items (order_id, product_id, qty, unit_price, gst_rate, hsn_code, amount, gst_amount, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [order1Res.rows[0].id, productIds[0], 100, 55.00, 18, '7208', 5500.00, 990.00, 6490.00]);

    // Order 2 (TechMec - Approved & Invoiced)
    const order2Res = await pool.query(`
      INSERT INTO orders (company_id, order_number, buyer_id, buyer_entity_id, total_amount, subtotal, gst_amount, grand_total, items_count, status, invoice_date, due_date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 DAYS', NOW() - INTERVAL '5 DAYS')
      RETURNING id
    `, [adminCompanyId, 'ORD-2026-0002', userB2Res.rows[0].id, buyer2Id, 16000.00, 16000.00, 2880.00, 18880.00, 2, 'approved']);
    
    await pool.query(`
      INSERT INTO order_items (order_id, product_id, qty, unit_price, gst_rate, hsn_code, amount, gst_amount, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [order2Res.rows[0].id, productIds[5], 5, 3200.00, 18, '8501', 16000.00, 2880.00, 18880.00]);

    console.log('\n=== Seed Completed Successfully ===\n');
    console.log('Login Details for Testing:');
    console.log('Admin: admin@bizflow.com / password123');
    console.log('Buyer 1 (Acme): buyer1@acmecorp.com / password123');
    console.log('Buyer 2 (TechMec): buyer2@techmec.com / password123');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    pool.end();
  }
};

seedDB();
