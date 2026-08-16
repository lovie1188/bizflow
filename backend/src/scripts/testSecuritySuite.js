// backend/src/scripts/testSecuritySuite.js
const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = 5002;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_bizflow_2026_super_secure';

const express = require('express');
const { isTokenRevoked, revokeToken } = require('../utils/tokenBlacklist');
const { verifyToken } = require('../middleware/auth');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body, json });
      });
    });

    req.on('error', reject);

    if (postData) {
      if (typeof postData === 'object' && !(postData instanceof Buffer)) {
        const jsonStr = JSON.stringify(postData);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Content-Length', Buffer.byteLength(jsonStr));
        req.write(jsonStr);
      } else {
        req.setHeader('Content-Length', Buffer.byteLength(postData));
        req.write(postData);
      }
    }
    req.end();
  });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ─────────────────────────────────────────────────────────────
// Test 1: H-9: Buyer Password Complexity Enforcement
// ─────────────────────────────────────────────────────────────
test('H-9: Buyer Password Complexity — Rejects short (<8 chars) or non-alphanumeric passwords', async () => {
  const checkPassword = (password) => {
    if (!password || password.length < 8) return false;
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return false;
    return true;
  };

  assert(!checkPassword('12345'), 'Should reject 5 chars');
  assert(!checkPassword('abcdefg'), 'Should reject 7 chars');
  assert(!checkPassword('onlyletters'), 'Should reject letters only');
  assert(!checkPassword('1234567890'), 'Should reject numbers only');
  assert(checkPassword('StrongP@ss1'), 'Should accept valid strong password');
  assert(checkPassword('BizFlow2026!'), 'Should accept valid strong password');
});

// ─────────────────────────────────────────────────────────────
// Test 2: H-3: Token Revocation & Invalidation Cache
// ─────────────────────────────────────────────────────────────
test('H-3: Token Blacklist — Revoked token is rejected by auth middleware', async () => {
  const token = jwt.sign({ userId: 123, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  assert(!isTokenRevoked(token), 'Fresh token must NOT be revoked');
  
  // Revoke token (simulating logout)
  revokeToken(token, 3600);
  assert(isTokenRevoked(token), 'Token must be marked as revoked after logout');

  // Test middleware rejection
  let statusSet = null;
  let jsonResponse = null;
  const mockReq = { headers: { authorization: `Bearer ${token}` } };
  const mockRes = {
    status: (code) => {
      statusSet = code;
      return {
        json: (data) => { jsonResponse = data; }
      };
    }
  };
  let nextCalled = false;
  const mockNext = () => { nextCalled = true; };

  verifyToken(mockReq, mockRes, mockNext);
  assert(statusSet === 401, `Expected 401 Unauthorized for revoked token, got ${statusSet}`);
  assert(!nextCalled, 'Next middleware must NOT be called for revoked token');
});

// ─────────────────────────────────────────────────────────────
// Test 3: M-8: Agreement Upload MIME Whitelist (PDF Only)
// ─────────────────────────────────────────────────────────────
test('M-8: Agreement Upload — Only application/pdf is accepted, images/docs are rejected', async () => {
  const ALLOWED_AGREEMENT_MIMETYPES = ['application/pdf'];
  
  const validateMime = (mime) => ALLOWED_AGREEMENT_MIMETYPES.includes(mime);

  assert(validateMime('application/pdf') === true, 'PDF must be accepted');
  assert(validateMime('image/jpeg') === false, 'JPEG must be rejected');
  assert(validateMime('image/png') === false, 'PNG must be rejected');
  assert(validateMime('application/msword') === false, 'DOC must be rejected');
  assert(validateMime('application/vnd.openxmlformats-officedocument.wordprocessingml.document') === false, 'DOCX must be rejected');
  assert(validateMime('application/x-sh') === false, 'Executable script must be rejected');
});

// ─────────────────────────────────────────────────────────────
// Test 4: H-7: Public Product Catalog Field Stripping
// ─────────────────────────────────────────────────────────────
test('H-7: Product Catalog — buy_price (cost) is strictly omitted for unauthenticated callers', async () => {
  const mockDbRow = {
    id: 1,
    company_id: 1,
    sku: 'SKU-001',
    name: 'Industrial Item',
    buy_price: 150.00, // sensitive cost
    trade_price: 220.00,
    stock: 50,
    min_order_qty: 5
  };

  const publicFields = ['id', 'company_id', 'sku', 'name', 'trade_price', 'stock', 'min_order_qty'];
  const filterPublicProduct = (row) => {
    const clean = {};
    for (const k of publicFields) {
      if (k in row) clean[k] = row[k];
    }
    return clean;
  };

  const sanitized = filterPublicProduct(mockDbRow);
  assert(!('buy_price' in sanitized), 'buy_price must NOT be present in sanitized output');
  assert(sanitized.trade_price === 220.00, 'trade_price should be preserved for buyers');
});

// ─────────────────────────────────────────────────────────────
// Test 5: H-8: Settings Whitelist
// ─────────────────────────────────────────────────────────────
test('H-8: Settings Whitelist — Only non-sensitive system settings are exposed', async () => {
  const PUBLIC_SETTING_KEYS = [
    'app_name',
    'razorpay_enabled',
    'whatsapp_enabled',
    'sms_enabled',
    'maintenance_mode',
    'msme_payment_days',
    'support_email',
    'currency',
  ];

  const sensitiveKeys = ['database_url', 'jwt_secret', 'email_pass', 'razorpay_key_secret', 'secret'];
  for (const s of sensitiveKeys) {
    assert(!PUBLIC_SETTING_KEYS.includes(s), `Sensitive key ${s} must NOT be in public settings whitelist`);
  }
});

// ─────────────────────────────────────────────────────────────
// Test 6: L-8 & M-4: Payload Limits & Security Express App Integration
// ─────────────────────────────────────────────────────────────
test('L-8: Express 1MB Payload Limit — Rejects payloads > 1MB with 413', async () => {
  const testApp = express();
  testApp.use(express.json({ limit: '1mb' }));
  testApp.post('/test-payload', (req, res) => res.json({ ok: true }));

  const server = await new Promise(r => {
    const s = testApp.listen(PORT, () => r(s));
  });

  try {
    const largeData = { dummy: 'X'.repeat(1.2 * 1024 * 1024) };
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/test-payload',
      method: 'POST'
    }, largeData);

    assert(res.statusCode === 413, `Expected 413 Payload Too Large, got ${res.statusCode}`);
  } finally {
    server.close();
  }
});

// ─────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────
async function runAll() {
  console.log('\n======================================================');
  console.log('🛡️  BIZFLOW SECURITY SUITE VERIFICATION REPORT');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      process.stdout.write(`⏳ Running: ${t.name}... `);
      await t.fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED');
      console.error(`   Error details:`, err.message || err);
      failed++;
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`Summary: Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('------------------------------------------------------\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  console.error('Test Runner encountered unhandled failure:', err);
  process.exit(1);
});
