/**
 * BizFlow Notifications Utility
 * Handles dispatching of transactional messages (Email, WhatsApp)
 */

// Simulated email integration. Replace console.log with real @sendgrid/mail calls later.
const sendEmail = async (to, subject, htmlContent) => {
  console.log(`[EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
  console.log(`[EMAIL CONTENT]\n${htmlContent}\n`);
  // return sendgrid.send({ to, from: 'no-reply@bizflow.in', subject, html: htmlContent });
};

// Simulated WhatsApp integration. Replace with real Twilio or WhatsApp Business API.
const sendWhatsApp = async (phone, message) => {
  console.log(`[WHATSAPP DISPATCH] To: ${phone} | Message: ${message}`);
  // return twilioClient.messages.create({ from: 'whatsapp:+14155238886', to: `whatsapp:${phone}`, body: message });
};

const sendPurchaseOrder = async (orderData, buyerEmail, buyerPhone) => {
  const { orderNumber, grandTotal, itemsCount, dueDate } = orderData;
  
  const emailSubject = `Purchase Order Confirmation: ${orderNumber}`;
  const emailHtml = `
    <h2>Purchase Order: ${orderNumber}</h2>
    <p>Thank you for your order. Here are the details:</p>
    <ul>
      <li><strong>Total Items:</strong> ${itemsCount}</li>
      <li><strong>Grand Total:</strong> ₹${parseFloat(grandTotal).toLocaleString('en-IN')}</li>
      <li><strong>Payment Due Date:</strong> ${new Date(dueDate).toDateString()}</li>
    </ul>
    <p>Please refer to the MSME Buyer-Supplier Agreement for the strict 45-day payment compliance rules.</p>
    <p>Best Regards,<br/>BizFlow Auto-Mailer</p>
  `;

  const waMessage = `*BizFlow PO Confirmation*\nOrder: ${orderNumber}\nAmount: ₹${parseFloat(grandTotal).toLocaleString('en-IN')}\nDue: ${new Date(dueDate).toDateString()}\n\nThank you for your business. Remember that prompt payment within 45 days is required under Section 43B(h).`;

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
