import express from 'express';
import { validate } from '../middlewares/validate.js';
import { authRequired, requireRole } from '../middlewares/auth.js';
import {
  getPurchaseDraftsSchema,
  getPurchaseDraftByIdSchema,
  approvePurchaseDraftSchema,
} from '../validations/draftValidation.js';
import {
  getPurchaseDraftsHandler,
  getPurchaseDraftByIdHandler,
  approvePurchaseDraftHandler,
} from '../controllers/draftController.js';

const router = express.Router();

// Get purchase drafts list
router.get('/', authRequired, validate(getPurchaseDraftsSchema), getPurchaseDraftsHandler);

// Get purchase draft by ID
router.get('/:id', authRequired, validate(getPurchaseDraftByIdSchema), getPurchaseDraftByIdHandler);

// Approve purchase draft (admin only)
router.post(
  '/:id/approve',
  authRequired,
  requireRole(['admin']),
  validate(approvePurchaseDraftSchema),
  approvePurchaseDraftHandler
);

export default router;
