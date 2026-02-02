import { adjustStock } from '../services/stockService.js';
import { successResponse } from '../utils/apiResponse.js';

async function adjustStockHandler(req, res, next) {
  try {
    const result = await adjustStock(req.validated.body, req.user.id);
    return res.json(successResponse(result, 'Stock adjusted successfully'));
  } catch (error) {
    return next(error);
  }
}

export { adjustStockHandler };
