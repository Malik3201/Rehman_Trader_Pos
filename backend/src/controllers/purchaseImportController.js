import { importPurchaseFromImage } from '../services/purchaseImportService.js';
import { successResponse } from '../utils/apiResponse.js';

async function importPurchaseHandler(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded');
      err.statusCode = 400;
      err.errorCode = 'NO_FILE';
      return next(err);
    }

    const draft = await importPurchaseFromImage(req.file, req.user.id);
    return res.status(201).json(successResponse(draft, 'Purchase draft created successfully'));
  } catch (error) {
    return next(error);
  }
}

export { importPurchaseHandler };
