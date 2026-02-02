import { getPurchases, getPurchaseById } from '../services/purchaseService.js';
import { successResponse } from '../utils/apiResponse.js';

async function getPurchasesHandler(req, res, next) {
  try {
    const filters = {
      from: req.validated.query.from,
      to: req.validated.query.to,
      page: parseInt(req.validated.query.page) || 1,
      limit: parseInt(req.validated.query.limit) || 20,
    };

    const result = await getPurchases(filters);
    return res.json(successResponse(result, 'Purchases retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

async function getPurchaseByIdHandler(req, res, next) {
  try {
    const purchase = await getPurchaseById(req.validated.params.id);
    return res.json(successResponse(purchase, 'Purchase retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

export { getPurchasesHandler, getPurchaseByIdHandler };
