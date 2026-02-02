import express from 'express';
import { validate } from '../middlewares/validate.js';
import { authRequired } from '../middlewares/auth.js';
import { createPaymentSchema } from '../validations/paymentValidation.js';
import { createPaymentHandler } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/', authRequired, validate(createPaymentSchema), createPaymentHandler);

export default router;
