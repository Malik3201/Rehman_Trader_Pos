const express = require('express');
const { validate } = require('../middlewares/validate');
const { authRequired, requireRole } = require('../middlewares/auth');
const { adjustStockSchema } = require('../validations/stockValidation');
const { adjustStockHandler } = require('../controllers/stockController');

const router = express.Router();

// Admin only
router.post('/adjust', authRequired, requireRole(['admin']), validate(adjustStockSchema), adjustStockHandler);

module.exports = router;
