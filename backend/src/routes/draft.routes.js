const express = require('express');
const { validate } = require('../middlewares/validate');
const { authRequired, requireRole } = require('../middlewares/auth');
const {
  getPurchaseDraftsSchema,
  getPurchaseDraftByIdSchema,
  approvePurchaseDraftSchema,
} = require('../validations/draftValidation');
const {
  getPurchaseDraftsHandler,
  getPurchaseDraftByIdHandler,
  approvePurchaseDraftHandler,
} = require('../controllers/draftController');

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

module.exports = router;
