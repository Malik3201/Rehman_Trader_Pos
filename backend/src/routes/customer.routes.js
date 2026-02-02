const express = require('express');
const { validate } = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const { getCustomerLedgerSchema } = require('../validations/customerValidation');
const { getCustomerLedgerHandler } = require('../controllers/customerController');

const router = express.Router();

// Get customer ledger
router.get('/:id/ledger', authRequired, validate(getCustomerLedgerSchema), getCustomerLedgerHandler);

module.exports = router;
