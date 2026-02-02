import { getCustomerLedger } from '../services/customerLedgerService.js';
import { successResponse } from '../utils/apiResponse.js';

async function getCustomerLedgerHandler(req, res, next) {
  try {
    const customerId = req.validated.params.id;
    const filters = {
      from: req.validated.query.from,
      to: req.validated.query.to,
    };
    const ledger = await getCustomerLedger(customerId, filters);
    return res.json(successResponse(ledger, 'Customer ledger retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

export { getCustomerLedgerHandler };
