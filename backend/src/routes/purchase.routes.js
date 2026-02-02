import express from 'express';
import { validate } from '../middlewares/validate.js';
import { authRequired, requireRole } from '../middlewares/auth.js';
import { upload, validateUploadedFile } from '../middlewares/upload.js';
import { importPurchaseSchema } from '../validations/purchaseImportValidation.js';
import { getPurchasesSchema, getPurchaseByIdSchema } from '../validations/purchaseValidation.js';
import { importPurchaseHandler } from '../controllers/purchaseImportController.js';
import { getPurchasesHandler, getPurchaseByIdHandler } from '../controllers/purchaseController.js';

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

export default router;
