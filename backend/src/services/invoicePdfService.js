import PDFDocument from 'pdfkit';
import Sale from '../models/Sale.js';
import { env } from '../config/env.js';

/**
 * Generate invoice PDF for wholesale sale
 */
async function generateInvoicePdf(saleId) {
  const sale = await Sale.findById(saleId)
    .populate('customerId', 'name shopName phone address')
    .lean();

  if (!sale) {
    const err = new Error('Sale not found');
    err.statusCode = 404;
    err.errorCode = 'SALE_NOT_FOUND';
    throw err;
  }

  if (sale.saleType !== 'wholesale') {
    const err = new Error('Invoice can only be generated for wholesale sales');
    err.statusCode = 400;
    err.errorCode = 'INVALID_SALE_TYPE';
    throw err;
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(env.SHOP_NAME, { align: 'center' });
      doc.moveDown(0.5);

      if (env.SHOP_ADDRESS) {
        doc.fontSize(10).font('Helvetica').text(env.SHOP_ADDRESS, { align: 'center' });
      }
      if (env.SHOP_PHONE) {
        doc.fontSize(10).text(`Phone: ${env.SHOP_PHONE}`, { align: 'center' });
      }
      if (env.SHOP_EMAIL) {
        doc.fontSize(10).text(`Email: ${env.SHOP_EMAIL}`, { align: 'center' });
      }

      doc.moveDown(1);

      // Invoice title
      doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(1);

      // Invoice details
      const invoiceNumber = `INV-${sale._id.toString().slice(-8).toUpperCase()}`;
      const invoiceDate = new Date(sale.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const invoiceTime = new Date(sale.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice #: ${invoiceNumber}`, 50, doc.y);
      doc.text(`Date: ${invoiceDate}`, 50, doc.y);
      doc.text(`Time: ${invoiceTime}`, 50, doc.y);
      doc.moveDown(1);

      // Customer details
      if (sale.customerId) {
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, doc.y);
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');
        doc.text(sale.customerId.name || 'N/A', 50, doc.y);
        if (sale.customerId.shopName) {
          doc.text(sale.customerId.shopName, 50, doc.y);
        }
        if (sale.customerId.phone) {
          doc.text(`Phone: ${sale.customerId.phone}`, 50, doc.y);
        }
        if (sale.customerId.address) {
          doc.text(`Address: ${sale.customerId.address}`, 50, doc.y);
        }
        doc.moveDown(1);
      }

      // Items table header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Unit Price', 300, tableTop);
      doc.text('Total', 400, tableTop);

      // Draw line
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(0.5);

      // Items
      doc.font('Helvetica');
      let itemsY = doc.y;
      for (const item of sale.items) {
        const itemName = item.nameSnapshot;
        const qty = `${item.qty} ${item.unitTypeSnapshot}`;
        const unitPrice = `Rs. ${item.unitPrice.toFixed(2)}`;
        const lineTotal = `Rs. ${item.lineTotal.toFixed(2)}`;

        doc.fontSize(9).text(itemName, 50, itemsY, { width: 180 });
        doc.text(qty, 250, itemsY);
        doc.text(unitPrice, 300, itemsY);
        doc.text(lineTotal, 400, itemsY);
        itemsY += 20;
      }

      doc.y = itemsY + 10;

      // Totals
      const totalsX = 350;
      doc.fontSize(10);
      doc.text(`Subtotal:`, totalsX, doc.y);
      doc.text(`Rs. ${sale.subTotal.toFixed(2)}`, 450, doc.y);
      doc.moveDown(0.3);

      if (sale.discount > 0) {
        doc.text(`Discount:`, totalsX, doc.y);
        doc.text(`Rs. ${sale.discount.toFixed(2)}`, 450, doc.y);
        doc.moveDown(0.3);
      }

      doc.font('Helvetica-Bold');
      doc.text(`Grand Total:`, totalsX, doc.y);
      doc.text(`Rs. ${sale.grandTotal.toFixed(2)}`, 450, doc.y);
      doc.moveDown(0.5);

      // Payment and balance info
      doc.font('Helvetica');
      doc.fontSize(10);
      doc.text(`Payment Received:`, totalsX, doc.y);
      doc.text(`Rs. ${sale.paymentReceived.toFixed(2)}`, 450, doc.y);
      doc.moveDown(0.5);

      if (sale.ledgerEffect) {
        doc.text(`Previous Balance:`, totalsX, doc.y);
        doc.text(`Rs. ${sale.ledgerEffect.previousBalance.toFixed(2)}`, 450, doc.y);
        doc.moveDown(0.3);

        const creditAdded = sale.grandTotal - sale.paymentReceived;
        if (creditAdded > 0) {
          doc.text(`Credit Added:`, totalsX, doc.y);
          doc.text(`Rs. ${creditAdded.toFixed(2)}`, 450, doc.y);
          doc.moveDown(0.3);
        }

        doc.font('Helvetica-Bold');
        doc.text(`New Balance:`, totalsX, doc.y);
        doc.text(`Rs. ${sale.ledgerEffect.newBalance.toFixed(2)}`, 450, doc.y);
      }

      // Notes
      if (sale.notes) {
        doc.moveDown(1);
        doc.font('Helvetica').fontSize(9);
        doc.text(`Notes: ${sale.notes}`, 50, doc.y);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text('Thank you for your business!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export { generateInvoicePdf };
