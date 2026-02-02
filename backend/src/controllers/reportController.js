import { getDailySummary } from '../services/reportService.js';
import { successResponse } from '../utils/apiResponse.js';

async function getDailySummaryHandler(req, res, next) {
  try {
    const date = req.validated.query.date;
    const summary = await getDailySummary(date);
    return res.json(successResponse(summary, 'Daily summary retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

export { getDailySummaryHandler };
