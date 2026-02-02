import { env } from '../config/env.js';
import { generateInvoicePdf } from './invoicePdfService.js';
import Sale from '../models/Sale.js';
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

/**
 * Generate WhatsApp share link for sale invoice
 */
async function generateWhatsAppShare(saleId, baseUrl) {
  const sale = await Sale.findById(saleId)
    .populate('customerId', 'name shopName phone')
    .lean();

  if (!sale) {
    const err = new Error('Sale not found');
    err.statusCode = 404;
    err.errorCode = 'SALE_NOT_FOUND';
    throw err;
  }

  if (sale.saleType !== 'wholesale') {
    const err = new Error('WhatsApp share is only available for wholesale sales');
    err.statusCode = 400;
    err.errorCode = 'INVALID_SALE_TYPE';
    throw err;
  }

  // Generate PDF
  const pdfBuffer = await generateInvoicePdf(saleId);

  // Save PDF temporarily (in production, use cloud storage)
  const uploadDir = path.resolve(env.UPLOAD_DIR || './uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const pdfFileName = `invoice_${saleId}_${nanoid()}.pdf`;
  const pdfPath = path.join(uploadDir, pdfFileName);
  await fs.writeFile(pdfPath, pdfBuffer);

  // Generate PDF URL (adjust based on your deployment)
  const pdfUrl = `${baseUrl}/api/v1/sales/${saleId}/invoice.pdf`;

  // Generate WhatsApp message text
  const customerName = sale.customerId?.name || sale.customerId?.shopName || 'Customer';
  const invoiceNumber = `INV-${sale._id.toString().slice(-8).toUpperCase()}`;
  const grandTotal = sale.grandTotal.toFixed(2);
  const paymentReceived = sale.paymentReceived.toFixed(2);
  const balance = sale.ledgerEffect?.newBalance?.toFixed(2) || '0.00';

  const messageText = `*Invoice ${invoiceNumber}*\n\n` +
    `Dear ${customerName},\n\n` +
    `Your invoice is ready:\n` +
    `Total: Rs. ${grandTotal}\n` +
    `Paid: Rs. ${paymentReceived}\n` +
    `Balance: Rs. ${balance}\n\n` +
    `View invoice: ${pdfUrl}\n\n` +
    `Thank you for your business!`;

  // Generate WhatsApp link
  const customerPhone = sale.customerId?.phone;
  let whatsappLink = null;

  if (customerPhone) {
    // Remove any non-digit characters except +
    const cleanPhone = customerPhone.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(messageText);
    whatsappLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  return {
    pdfUrl,
    whatsappLink,
    messageText,
    customerPhone,
  };
}

export { generateWhatsAppShare };
