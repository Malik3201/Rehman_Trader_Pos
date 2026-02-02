import { getPurchaseDrafts, getPurchaseDraftById } from '../services/draftService.js';
import { approvePurchaseDraft } from '../services/purchaseService.js';
import { successResponse } from '../utils/apiResponse.js';

async function getPurchaseDraftsHandler(req, res, next) {
  try {
    const filters = {
      status: req.validated.query.status,
      page: parseInt(req.validated.query.page) || 1,
      limit: parseInt(req.validated.query.limit) || 20,
    };

    const result = await getPurchaseDrafts(filters);
    return res.json(successResponse(result, 'Purchase drafts retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

async function getPurchaseDraftByIdHandler(req, res, next) {
  try {
    const draft = await getPurchaseDraftById(req.validated.params.id);
    return res.json(successResponse(draft, 'Purchase draft retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

async function approvePurchaseDraftHandler(req, res, next) {
  try {
    const purchase = await approvePurchaseDraft(
      req.validated.params.id,
      req.validated.body,
      req.user.id
    );
    return res.json(successResponse(purchase, 'Purchase draft approved and purchase created successfully'));
  } catch (error) {
    return next(error);
  }
}

export {
  getPurchaseDraftsHandler,
  getPurchaseDraftByIdHandler,
  approvePurchaseDraftHandler,
};
