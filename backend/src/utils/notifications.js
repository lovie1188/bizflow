/**
 * BizFlow Notifications Utility
 * Handles dispatching of transactional messages (Email, WhatsApp)
 */

const nodemailer = require('nodemailer');

// ── Email Transport (Nodemailer) ──────────────────────────────────────────────
// Configure via .env: EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
// Supports Gmail, Zoho, SMTP2Go, any SMTP provider.
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[EMAIL] SMTP credentials not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env to enable real emails.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for port 465 (SSL), false for 587 (TLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

const sendEmail = async (to, subject, htmlContent) => {
  const t = getTransporter();
  if (!t) {
    // Graceful degradation — log only, don't crash
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const info = await t.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'BizFlow India'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject} | MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
    return false;
  }
};

// ── WhatsApp (Twilio / MSG91) ──────────────────────────────────────────────────
// To enable: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env
const sendWhatsApp = async (phone, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[WHATSAPP STUB] To: ${phone} | Message: ${message.substring(0, 50)}...`);
    return false;
  }
  try {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await twilio.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || '+14155238886'}`,
      to: `whatsapp:${phone}`,
      body: message,
    });
    console.log(`[WHATSAPP SENT] To: ${phone} | SID: ${msg.sid}`);
    return true;
  } catch (err) {
    console.error(`[WHATSAPP ERROR] Failed to send to ${phone}:`, err.message);
    return false;
  }
};

const sendPurchaseOrder = async (orderData, buyerEmail, buyerPhone) => {
  const { orderNumber, grandTotal, itemsCount, dueDate } = orderData;
  
  const emailSubject = `Purchase Order Confirmation: ${orderNumber}`;
  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #02B290;border-radius:8px;overflow:hidden;">
      <div style="background:#02B290;color:#fff;padding:16px 20px;">
        <h2 style="margin:0;">✅ Purchase Order Confirmed</h2>
        <p style="margin:4px 0 0;opacity:.85;">BizFlow India — MSME Compliant Platform</p>
      </div>
      <div style="padding:20px;">
        <h3 style="color:#02B290;">Order: ${orderNumber}</h3>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
          <tr style="background:#f0faf7;"><td style="padding:8px;font-weight:700;">Total Items</td><td style="padding:8px;">${itemsCount}</td></tr>
          <tr><td style="padding:8px;font-weight:700;">Grand Total</td><td style="padding:8px;font-weight:700;color:#02B290;">₹${parseFloat(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          <tr style="background:#f0faf7;"><td style="padding:8px;font-weight:700;">Payment Due Date</td><td style="padding:8px;">${new Date(dueDate).toLocaleDateString('en-IN')}</td></tr>
        </table>
        <p style="color:#666;font-size:13px;">Please refer to the MSME Buyer-Supplier Agreement for the strict 45-day payment compliance rules under Section 43B(h) of the Income Tax Act.</p>
        <p style="color:#888;font-size:12px;">Regards,<br/><strong>BizFlow Auto-Mailer</strong></p>
      </div>
    </div>`;

  const waMessage = `✅ *BizFlow PO Confirmation*\nOrder: ${orderNumber}\nAmount: ₹${parseFloat(grandTotal).toLocaleString('en-IN')}\nDue: ${new Date(dueDate).toLocaleDateString('en-IN')}\n\nThank you for your business. Remember: 45-day payment required under Section 43B(h).`;

  try {
    if (buyerEmail) await sendEmail(buyerEmail, emailSubject, emailHtml);
    if (buyerPhone) await sendWhatsApp(buyerPhone, waMessage);
    return true;
  } catch (err) {
    console.error('Failed to dispatch PO notifications', err);
    return false;
  }
};

module.exports = {
  sendPurchaseOrder,
  sendEmail,
  sendWhatsApp
};

