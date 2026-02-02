const express = require('express');
const { validate } = require('../middlewares/validate');
const { authRequired, requireRole } = require('../middlewares/auth');
const { upload, validateUploadedFile } = require('../middlewares/upload');
const { importPurchaseSchema } = require('../validations/purchaseImportValidation');
const { getPurchasesSchema, getPurchaseByIdSchema } = require('../validations/purchaseValidation');
const { importPurchaseHandler } = require('../controllers/purchaseImportController');
const { getPurchasesHandler, getPurchaseByIdHandler } = require('../controllers/purchaseController');

const router = express.Router();

// Import purchase from receipt image (admin only)
router.post(
  '/import',
  authRequired,
  requireRole(['admin']),
  upload.single('image'),
  validateUploadedFile,
  validate(importPurchaseSchema),
  importPurchaseHandler
);

// Get purchases list
router.get('/', authRequired, validate(getPurchasesSchema), getPurchasesHandler);

// Get purchase by ID
router.get('/:id', authRequired, validate(getPurchaseByIdSchema), getPurchaseByIdHandler);

module.exports = router;
