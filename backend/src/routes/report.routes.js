import express from 'express';
import { validate } from '../middlewares/validate.js';
import { authRequired } from '../middlewares/auth.js';
import { getDailySummarySchema } from '../validations/reportValidation.js';
import { getDailySummaryHandler } from '../controllers/reportController.js';

const router = express.Router();

router.get('/daily', authRequired, validate(getDailySummarySchema), getDailySummaryHandler);

export default router;
