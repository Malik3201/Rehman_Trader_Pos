import express from 'express';
import { validate } from '../middlewares/validate.js';
import { authRequired } from '../middlewares/auth.js';
import {
  retailSaleSchema,
  wholesaleSaleSchema,
  getSalesSchema,
  getSaleByIdSchema,
  getInvoicePdfSchema,
  getWhatsAppShareSchema,
} from '../validations/salesValidation.js';
import {
  createRetailSaleHandler,
  createWholesaleSaleHandler,
  getSalesHandler,
  getSaleByIdHandler,
  getInvoicePdfHandler,
} from '../controllers/salesController.js';
import { getWhatsAppShareHandler } from '../controllers/whatsappShareController.js';

const router = express.Router();

// Create retail sale
router.post('/retail', authRequired, validate(retailSaleSchema), createRetailSaleHandler);

// Create wholesale sale
router.post('/wholesale', authRequired, validate(wholesaleSaleSchema), createWholesaleSaleHandler);

// Get sales list
router.get('/', authRequired, validate(getSalesSchema), getSalesHandler);

// Get sale by ID
router.get('/:id', authRequired, validate(getSaleByIdSchema), getSaleByIdHandler);

// Get invoice PDF
router.get('/:id/invoice.pdf', authRequired, validate(getInvoicePdfSchema), getInvoicePdfHandler);

// Get WhatsApp share link
router.get('/:id/share', authRequired, validate(getWhatsAppShareSchema), getWhatsAppShareHandler);

export default router;
