/**
 * BizFlow — MSME Overdue Reminder Cron Job
 * Runs daily at 8:00 AM IST (02:30 UTC)
 * Sends email + WhatsApp reminders for invoices overdue by 30, 44, and 45+ days.
 * Section 43B(h) of Income Tax Act — 45 day MSME payment window.
 */

const cron = require('node-cron');
const pool = require('../utils/db');
const { sendEmail, sendWhatsApp } = require('../utils/notifications');

const INTEREST_RATE = 19.5; // 3x RBI Bank Rate (compound)

const calcInterest = (amount, days) => {
  if (days <= 45) return 0;
  const overdueDays = days - 45;
  return amount * (INTEREST_RATE / 100) * (overdueDays / 365);
};

const runOverdueCheck = async () => {
  console.log('[CRON] Running MSME 45-Day overdue check...');
  try {
    // Fetch all unpaid invoices older than 30 days with buyer details
    const result = await pool.query(`
      SELECT
        i.id, i.invoice_number, i.amount, i.due_date, i.created_at, i.company_id,
        b.name  AS buyer_name,  b.email AS buyer_email, b.phone AS buyer_phone,
        c.name  AS company_name
      FROM invoices i
      LEFT JOIN buyers  b ON i.buyer_entity_id = b.id
      LEFT JOIN companies c ON i.company_id    = c.id
      WHERE i.paid = false
        AND i.created_at <= NOW() - INTERVAL '30 days'
      ORDER BY i.created_at ASC
    `);

    const today = new Date();
    let sent = 0;

    for (const inv of result.rows) {
      const createdAt  = new Date(inv.created_at);
      const daysElapsed = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
      const amount     = parseFloat(inv.amount || 0);
      const interest   = calcInterest(amount, daysElapsed);
      const fmtAmt     = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

      let urgency = '';
      let emailSubject = '';
      let emailHtml = '';
      let waMsg = '';

      if (daysElapsed >= 45) {
        // 🔴 CRITICAL: Past 45-day limit — Section 43B(h) triggered
        urgency = 'CRITICAL';
        emailSubject = `⚠️ URGENT: Section 43B(h) Triggered — Invoice ${inv.invoice_number} Overdue ${daysElapsed} Days`;
        emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:2px solid #dc2626;border-radius:8px;overflow:hidden;">
            <div style="background:#dc2626;color:#fff;padding:16px 20px;">
              <h2 style="margin:0;">🚨 CRITICAL: MSME Payment Overdue</h2>
              <p style="margin:4px 0 0;opacity:.85;">Section 43B(h) of Income Tax Act — Immediate Action Required</p>
            </div>
            <div style="padding:20px;">
              <p>Dear <strong>${inv.buyer_name}</strong>,</p>
              <p>Your invoice <strong>${inv.invoice_number}</strong> from <strong>${inv.company_name}</strong> is <strong>${daysElapsed} days overdue</strong> and has crossed the mandatory 45-day MSME payment threshold.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr style="background:#fef2f2;"><td style="padding:8px;font-weight:700;">Invoice No.</td><td style="padding:8px;">${inv.invoice_number}</td></tr>
                <tr><td style="padding:8px;font-weight:700;">Invoice Amount</td><td style="padding:8px;">₹${fmtAmt(amount)}</td></tr>
                <tr style="background:#fef2f2;"><td style="padding:8px;font-weight:700;">Days Overdue</td><td style="padding:8px;color:#dc2626;font-weight:700;">${daysElapsed} Days</td></tr>
                <tr><td style="padding:8px;font-weight:700;">Compound Interest (19.5% p.a.)</td><td style="padding:8px;color:#dc2626;">₹${fmtAmt(interest)}</td></tr>
                <tr style="background:#dc2626;color:#fff;"><td style="padding:8px;font-weight:700;">Total Due</td><td style="padding:8px;font-weight:700;">₹${fmtAmt(amount + interest)}</td></tr>
              </table>
              <p style="color:#dc2626;font-weight:700;">⚠️ Tax Impact: You have lost the right to claim a tax deduction for this expense under Section 43B(h) of the Income Tax Act until this payment is cleared.</p>
              <p>Please clear this payment immediately to avoid further penalties and legal proceedings under the MSMED Act 2006.</p>
              <p>Regards,<br/><strong>${inv.company_name}</strong> via BizFlow</p>
            </div>
          </div>`;
        waMsg = `🚨 *CRITICAL — MSME Invoice Overdue*\n\nDear ${inv.buyer_name},\n\nInvoice *${inv.invoice_number}* is *${daysElapsed} days overdue*.\n\n💰 Amount: ₹${fmtAmt(amount)}\n📈 Interest (19.5% p.a.): ₹${fmtAmt(interest)}\n🔴 Total Due: ₹${fmtAmt(amount + interest)}\n\n⚠️ Section 43B(h) triggered. Your tax deduction is at risk.\n\nPlease pay immediately. — ${inv.company_name}`;

      } else if (daysElapsed === 44) {
        // 🟠 WARNING: 1 day before limit
        urgency = 'WARNING';
        emailSubject = `⚠️ Last Warning: Invoice ${inv.invoice_number} Due Tomorrow (Day 44)`;
        emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:2px solid #f59e0b;border-radius:8px;overflow:hidden;">
            <div style="background:#f59e0b;color:#fff;padding:16px 20px;">
              <h2 style="margin:0;">⚠️ Last Warning: Payment Due Tomorrow</h2>
              <p style="margin:4px 0 0;opacity:.85;">MSME 45-Day Threshold — Day 44 of 45</p>
            </div>
            <div style="padding:20px;">
              <p>Dear <strong>${inv.buyer_name}</strong>,</p>
              <p>This is your final reminder. Invoice <strong>${inv.invoice_number}</strong> for ₹${fmtAmt(amount)} is due <strong>tomorrow</strong>. After Day 45, Section 43B(h) of the Income Tax Act will be triggered.</p>
              <p>Please make payment today to avoid compound interest and tax implications.</p>
              <p>Regards,<br/><strong>${inv.company_name}</strong> via BizFlow</p>
            </div>
          </div>`;
        waMsg = `⚠️ *Last Warning — Pay Today*\n\nDear ${inv.buyer_name},\nInvoice *${inv.invoice_number}* — ₹${fmtAmt(amount)}\n\n🕐 Day 44 of 45. One day left before Section 43B(h) penalty.\nPlease pay today! — ${inv.company_name}`;

      } else if (daysElapsed === 30) {
        // 🟡 EARLY WARNING: Day 30
        urgency = 'EARLY';
        emailSubject = `📋 Payment Reminder: Invoice ${inv.invoice_number} — Day 30 of 45`;
        emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #3b82f6;border-radius:8px;overflow:hidden;">
            <div style="background:#3b82f6;color:#fff;padding:16px 20px;">
              <h2 style="margin:0;">📋 MSME Payment Reminder</h2>
              <p style="margin:4px 0 0;opacity:.85;">Day 30 of 45 — 15 Days Remaining</p>
            </div>
            <div style="padding:20px;">
              <p>Dear <strong>${inv.buyer_name}</strong>,</p>
              <p>This is a friendly reminder that Invoice <strong>${inv.invoice_number}</strong> for ₹${fmtAmt(amount)} is 30 days old. You have <strong>15 days remaining</strong> to pay within the MSME 45-day threshold.</p>
              <p>Please plan your payment to avoid Section 43B(h) tax implications.</p>
              <p>Regards,<br/><strong>${inv.company_name}</strong> via BizFlow</p>
            </div>
          </div>`;
        waMsg = `📋 *Payment Reminder — Day 30*\n\nDear ${inv.buyer_name},\nInvoice *${inv.invoice_number}* — ₹${fmtAmt(amount)}\n\n📅 15 days remaining in the MSME 45-day window.\nPlease plan your payment. — ${inv.company_name}`;
      }

      // Only send if we matched a trigger day
      if (urgency && (inv.buyer_email || inv.buyer_phone)) {
        try {
          // M-3: Idempotency check — skip if this day_trigger was already sent for this invoice
          const alreadySent = await pool.query(
            `SELECT id FROM notifications WHERE invoice_id = $1 AND day_trigger = $2 AND status = 'sent' LIMIT 1`,
            [inv.id, daysElapsed]
          );
          if (alreadySent.rows.length > 0) {
            continue; // Already sent for this trigger day — skip
          }

          if (inv.buyer_email) await sendEmail(inv.buyer_email, emailSubject, emailHtml);
          if (inv.buyer_phone) await sendWhatsApp(inv.buyer_phone, waMsg);

          // Log notification to DB
          await pool.query(
            `INSERT INTO notifications (company_id, invoice_id, type, day_trigger, sent_at, status)
             VALUES ($1, $2, $3, $4, NOW(), 'sent')`,
            [inv.company_id, inv.id, `overdue_${urgency.toLowerCase()}`, daysElapsed]
          );
          sent++;
          console.log(`[CRON] Sent ${urgency} reminder for Invoice ${inv.invoice_number} (Day ${daysElapsed}) to ${inv.buyer_email || inv.buyer_phone}`);
        } catch (notifErr) {
          console.error(`[CRON] Failed to send reminder for Invoice ${inv.invoice_number}:`, notifErr.message);
        }
      }
    }

    console.log(`[CRON] Overdue check complete. Processed: ${result.rows.length}, Sent: ${sent}`);
  } catch (err) {
    console.error('[CRON] Overdue check failed:', err.message);
  }
};

/**
 * Schedule: Every day at 8:00 AM IST (2:30 AM UTC)
 * Cron: '30 2 * * *'
 */
const scheduleOverdueReminders = () => {
  cron.schedule('30 2 * * *', runOverdueCheck, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  console.log('[CRON] MSME 45-Day Overdue Reminder scheduled — daily at 8:00 AM IST');
};

module.exports = { scheduleOverdueReminders, runOverdueCheck };
