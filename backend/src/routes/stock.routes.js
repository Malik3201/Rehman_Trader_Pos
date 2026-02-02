import express from 'express';
import { validate } from '../middlewares/validate.js';
import { authRequired, requireRole } from '../middlewares/auth.js';
import { adjustStockSchema } from '../validations/stockValidation.js';
import { adjustStockHandler } from '../controllers/stockController.js';

const router = express.Router();

// Admin only
router.post('/adjust', authRequired, requireRole(['admin']), validate(adjustStockSchema), adjustStockHandler);

export default router;
