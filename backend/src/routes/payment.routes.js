const express = require('express');
const { validate } = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const { createPaymentSchema } = require('../validations/paymentValidation');
const { createPaymentHandler } = require('../controllers/paymentController');

const router = express.Router();

router.post('/', authRequired, validate(createPaymentSchema), createPaymentHandler);

module.exports = router;
