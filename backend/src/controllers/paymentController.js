import { createPayment } from '../services/paymentService.js';
import { successResponse } from '../utils/apiResponse.js';

async function createPaymentHandler(req, res, next) {
  try {
    const payment = await createPayment(req.validated.body, req.user.id);
    return res.status(201).json(successResponse(payment, 'Payment recorded successfully'));
  } catch (error) {
    return next(error);
  }
}

export { createPaymentHandler };
