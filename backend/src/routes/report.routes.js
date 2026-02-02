const express = require('express');
const { validate } = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const { getDailySummarySchema } = require('../validations/reportValidation');
const { getDailySummaryHandler } = require('../controllers/reportController');

const router = express.Router();

router.get('/daily', authRequired, validate(getDailySummarySchema), getDailySummaryHandler);

module.exports = router;
