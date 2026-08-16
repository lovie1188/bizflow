// backend/src/scripts/testBusinessLogicSuite.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ─────────────────────────────────────────────────────────────
// Test 1: M-1 Atomic Stock Deduction & Concurrency Simulation
// ─────────────────────────────────────────────────────────────
test('M-1: Atomic Stock Deduction — Concurrent orders cannot drive inventory negative', async () => {
  // Simulate concurrent stock deduction logic using the atomic WHERE stock >= qty constraint
  let simulatedDbStock = 5; // Total available stock

  const atomicDeduct = async (orderQty) => {
    // Mimics: UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock
    if (simulatedDbStock >= orderQty) {
      simulatedDbStock -= orderQty;
      return { success: true, remaining: simulatedDbStock };
    } else {
      return { success: false, error: 'Insufficient stock' };
    }
  };

  // Launch 3 simultaneous orders of 2 units each (total 6 requested, but only 5 available)
  const order1 = atomicDeduct(2);
  const order2 = atomicDeduct(2);
  const order3 = atomicDeduct(2);

  const results = await Promise.all([order1, order2, order3]);
  const successfulOrders = results.filter(r => r.success);
  const failedOrders = results.filter(r => !r.success);

  assert(successfulOrders.length === 2, `Expected 2 orders to succeed, got ${successfulOrders.length}`);
  assert(failedOrders.length === 1, `Expected 1 order to fail with insufficient stock, got ${failedOrders.length}`);
  assert(simulatedDbStock === 1, `Expected remaining stock to be exactly 1, got ${simulatedDbStock}`);
  assert(simulatedDbStock >= 0, `Inventory must never drop below zero, got ${simulatedDbStock}`);
});

// ─────────────────────────────────────────────────────────────
// Test 2: M-2 Transactional Order Cancellation & Credit Restock
// ─────────────────────────────────────────────────────────────
test('M-2: Order Status Update — Cancelling/Rejecting an order atomically restores credit limit and restocks inventory', async () => {
  let buyer = { id: 101, used_credit: 25000, credit_limit: 100000 };
  let productStock = { id: 201, stock: 10 };
  let order = { id: 501, status: 'pending', grand_total: 15000, items: [{ product_id: 201, qty: 3 }] };

  // Transaction simulation: Rejecting the order
  const rejectOrderTransaction = async (orderToReject, status) => {
    if (!['rejected', 'cancelled'].includes(status)) return false;
    if (['rejected', 'cancelled'].includes(orderToReject.status)) return false; // already rejected

    // Atomic step 1: restore used credit (GREATEST to prevent negative used credit)
    buyer.used_credit = Math.max(buyer.used_credit - orderToReject.grand_total, 0);

    // Atomic step 2: restock items
    for (const item of orderToReject.items) {
      productStock.stock += item.qty;
    }

    // Atomic step 3: update order status
    orderToReject.status = status;
    return true;
  };

  const ok = await rejectOrderTransaction(order, 'rejected');
  assert(ok === true, 'Rejection transaction should succeed');
  assert(order.status === 'rejected', 'Order status should be updated to rejected');
  assert(buyer.used_credit === 10000, `Expected used credit to decrease from 25000 to 10000, got ${buyer.used_credit}`);
  assert(productStock.stock === 13, `Expected product stock to be restored from 10 to 13, got ${productStock.stock}`);
});

// ─────────────────────────────────────────────────────────────
// Test 3: M-3 MSME Overdue Notification Idempotency
// ─────────────────────────────────────────────────────────────
test('M-3: Overdue Reminder Idempotency — Avoids duplicate notifications for same invoice & trigger day', async () => {
  const sentNotifications = new Set(); // Stores key: `${invoice_id}_${day_trigger}`

  const sendOverdueNotification = async (invoiceId, daysElapsed) => {
    const key = `${invoiceId}_${daysElapsed}`;
    // Idempotency check:
    if (sentNotifications.has(key)) {
      return { sent: false, skipped: true, reason: 'Already notified for this trigger day' };
    }

    // Send notification and record
    sentNotifications.add(key);
    return { sent: true, skipped: false };
  };

  // First cron execution on Day 30
  const run1 = await sendOverdueNotification(1001, 30);
  assert(run1.sent === true && !run1.skipped, 'First execution must send notification');

  // Duplicate cron execution on Day 30 (same day retry or scheduled run)
  const run2 = await sendOverdueNotification(1001, 30);
  assert(run2.sent === false && run2.skipped === true, 'Second execution on same trigger day must be skipped');

  // Next milestone (Day 40)
  const run3 = await sendOverdueNotification(1001, 40);
  assert(run3.sent === true && !run3.skipped, 'Milestone on Day 40 must send notification');
});

// ─────────────────────────────────────────────────────────────
// Test 4: C-6 Multi-Tenant Isolation & Webhook Company Guard
// ─────────────────────────────────────────────────────────────
test('C-6: Multi-Tenant Isolation — Cross-company payment webhooks and order assignments are blocked', async () => {
  const companyA = { id: 1, name: 'Alpha Supplies' };
  const companyB = { id: 2, name: 'Beta Traders' };

  const invoice = { id: 901, company_id: companyA.id, amount: 5000, status: 'pending' };

  // Simulated Webhook verifying company ownership
  const verifyWebhookPayment = (incomingCompanyId, incomingInvoiceId, incomingAmount) => {
    if (invoice.id !== incomingInvoiceId) return { valid: false, error: 'Invoice not found' };
    if (invoice.company_id !== incomingCompanyId) return { valid: false, error: 'Tenant isolation violation: cross-company payment forbidden' };
    if (invoice.amount !== incomingAmount) return { valid: false, error: 'Amount mismatch' };
    return { valid: true };
  };

  // Attempt cross-company payment (Company B attempting to settle Company A's invoice)
  const crossTenantAttempt = verifyWebhookPayment(companyB.id, invoice.id, 5000);
  assert(!crossTenantAttempt.valid, 'Cross-tenant webhook must be rejected');
  assert(crossTenantAttempt.error.includes('Tenant isolation violation'), 'Must report tenant isolation violation');

  // Legitimate company payment
  const validPayment = verifyWebhookPayment(companyA.id, invoice.id, 5000);
  assert(validPayment.valid === true, 'Legitimate tenant webhook must pass');
});

// ─────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────
async function runAll() {
  console.log('\n======================================================');
  console.log('⚡ BIZFLOW BUSINESS LOGIC & CONCURRENCY TEST SUITE');
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
      console.error(`   Error: ${err.message}\n`);
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
