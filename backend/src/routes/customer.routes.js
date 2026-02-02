import express from 'express';
import { validate } from '../middlewares/validate.js';
import { authRequired } from '../middlewares/auth.js';
import { getCustomerLedgerSchema } from '../validations/customerValidation.js';
import { getCustomerLedgerHandler } from '../controllers/customerController.js';

const router = express.Router();

// Get customer ledger
router.get('/:id/ledger', authRequired, validate(getCustomerLedgerSchema), getCustomerLedgerHandler);

export default router;
