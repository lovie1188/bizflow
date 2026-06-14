const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../../uploads/docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

function generatePO(orderData, buyer, supplier) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `PO_${orderData.order_number}.pdf`;
      const filePath = path.join(docsDir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('PURCHASE ORDER', { align: 'center' }).moveDown();
      doc.fontSize(10).text(`PO Number: ${orderData.order_number}`, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown();

      // Buyer & Supplier Info
      const topY = doc.y;
      doc.text('BUYER:', 50, topY, { underline: true });
      doc.text(buyer.name);
      doc.text(`GSTIN: ${buyer.gstin}`);
      doc.text(buyer.address);

      doc.text('SUPPLIER:', 300, topY, { underline: true });
      doc.text(supplier.name);
      doc.text(`GSTIN: ${supplier.gstin}`);
      doc.moveDown(2);

      // Digital Signature Info
      doc.rect(50, doc.y, 500, 30).fillAndStroke('#f0f0f0', '#ccc');
      doc.fillColor('black').text(`Digitally accepted by: ${orderData.tc_signature}`, 60, doc.y - 20);
      doc.moveDown(2);

      // Items Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Product', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Unit Price', 300, tableTop);
      doc.text('GST %', 380, tableTop);
      doc.text('Total', 450, tableTop);
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.font('Helvetica');

      // Items
      let y = tableTop + 25;
      orderData.items.forEach(item => {
        doc.text(item.name || `Product ID ${item.productId}`, 50, y);
        doc.text(item.qty.toString(), 250, y);
        doc.text(`Rs ${Number(item.unitPrice).toFixed(2)}`, 300, y);
        doc.text(`${item.gstRate}%`, 380, y);
        const total = (item.qty * item.unitPrice) * (1 + item.gstRate/100);
        doc.text(`Rs ${total.toFixed(2)}`, 450, y);
        y += 20;
      });

      // Totals
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 380, y);
      doc.text(`Rs ${Number(orderData.subtotal).toFixed(2)}`, 450, y);
      y += 15;
      doc.text('GST Total:', 380, y);
      doc.text(`Rs ${Number(orderData.gstAmount).toFixed(2)}`, 450, y);
      y += 15;
      doc.fontSize(12).text('Grand Total:', 360, y);
      doc.text(`Rs ${Number(orderData.grandTotal).toFixed(2)}`, 450, y);
      
      // Footer / Clauses
      doc.moveDown(4);
      doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions / Return Policy:');
      doc.font('Helvetica').fontSize(8);
      doc.text('1. Return & Replace of goods will only be allowed within 24 hours of delivery.');
      doc.text('2. Complaints for expired or damaged goods must be placed within 12 hours of delivery.');
      doc.text('3. NO Return or replacement will be accepted after 72 hours from the time of delivery.');
      doc.text('4. Payment is due within 15 days as per MSME regulations.');

      doc.end();
      stream.on('finish', () => resolve(`/uploads/docs/${fileName}`));
      stream.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

function generateInvoice(orderData, buyer, supplier, invoiceNumber) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `INV_${orderData.order_number}.pdf`;
      const filePath = path.join(docsDir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' }).moveDown();
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice No: ${invoiceNumber}`, { align: 'right' });
      doc.text(`Order No: ${orderData.order_number}`, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown();

      // Buyer & Supplier Info
      const topY = doc.y;
      doc.font('Helvetica-Bold').text('BILLED TO (BUYER):', 50, topY);
      doc.font('Helvetica').text(buyer.name);
      doc.text(`GSTIN: ${buyer.gstin}`);
      doc.text(buyer.address);

      doc.font('Helvetica-Bold').text('SUPPLIER:', 300, topY);
      doc.font('Helvetica').text(supplier.name);
      doc.text(`GSTIN: ${supplier.gstin}`);
      doc.moveDown(3);

      // Items Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('HSN', 200, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Rate', 300, tableTop);
      doc.text('GST %', 360, tableTop);
      doc.text('GST Amt', 410, tableTop);
      doc.text('Total', 480, tableTop);
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.font('Helvetica');

      // Items
      let y = tableTop + 25;
      orderData.items.forEach(item => {
        doc.text(item.name || `Product ID ${item.productId}`, 50, y, { width: 140 });
        doc.text(item.hsnCode || 'N/A', 200, y);
        doc.text(item.qty.toString(), 250, y);
        doc.text(Number(item.unitPrice).toFixed(2), 300, y);
        doc.text(`${item.gstRate}%`, 360, y);
        
        const itemAmount = item.qty * item.unitPrice;
        const itemGst = itemAmount * (item.gstRate / 100);
        const itemTotal = itemAmount + itemGst;

        doc.text(itemGst.toFixed(2), 410, y);
        doc.text(itemTotal.toFixed(2), 480, y);
        y += 20;
      });

      // Totals
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;
      doc.font('Helvetica-Bold');
      doc.text('Taxable Value:', 380, y);
      doc.text(`Rs ${Number(orderData.subtotal).toFixed(2)}`, 480, y);
      y += 15;
      doc.text('Total Tax:', 380, y);
      doc.text(`Rs ${Number(orderData.gstAmount).toFixed(2)}`, 480, y);
      y += 15;
      doc.fontSize(12).text('Invoice Total:', 360, y);
      doc.text(`Rs ${Number(orderData.grandTotal).toFixed(2)}`, 480, y);
      
      // Footer / Clauses
      doc.moveDown(4);
      doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions / Return Policy:');
      doc.font('Helvetica').fontSize(8);
      doc.text('1. Return & Replace of goods will only be allowed within 24 hours of delivery.');
      doc.text('2. Complaints for expired or damaged goods must be placed within 12 hours of delivery.');
      doc.text('3. NO Return or replacement will be accepted after 72 hours from the time of delivery.');
      doc.text('4. Payment is due within 15 days as per MSME regulations.');
      doc.moveDown();
      doc.text('This is a computer generated invoice and does not require a physical signature.', { align: 'center', italic: true });

      doc.end();
      stream.on('finish', () => resolve(`/uploads/docs/${fileName}`));
      stream.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  generatePO,
  generateInvoice
};
