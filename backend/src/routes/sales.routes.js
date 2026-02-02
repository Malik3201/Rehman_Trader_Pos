const express = require('express');
const { validate } = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const {
  retailSaleSchema,
  wholesaleSaleSchema,
  getSalesSchema,
  getSaleByIdSchema,
  getInvoicePdfSchema,
  getWhatsAppShareSchema,
} = require('../validations/salesValidation');
const {
  createRetailSaleHandler,
  createWholesaleSaleHandler,
  getSalesHandler,
  getSaleByIdHandler,
  getInvoicePdfHandler,
} = require('../controllers/salesController');
const { getWhatsAppShareHandler } = require('../controllers/whatsappShareController');

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

module.exports = router;
