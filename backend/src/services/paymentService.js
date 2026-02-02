import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import { applyPayment } from './ledgerService.js';
import { logger } from '../utils/logger.js';

/**
 * Create standalone payment
 */
async function createPayment(paymentData, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerId, amount, method = 'cash', note } = paymentData;

    if (!customerId) {
      const err = new Error('Customer ID is required');
      err.statusCode = 400;
      err.errorCode = 'CUSTOMER_REQUIRED';
      throw err;
    }

    // Apply payment to customer balance
    const { previousBalance, newBalance } = await applyPayment(session, customerId, amount);

    // Create payment record
    const payment = new Payment({
      customerId,
      amount,
      method,
      note,
      receivedBy: userId,
    });

    await payment.save({ session });
    await session.commitTransaction();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('customerId', 'name shopName phone')
      .populate('receivedBy', 'name phone')
      .lean();

    logger.info(`Payment created: ${payment._id} for customer ${customerId}`);
    return populatedPayment;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error creating payment', error);
    throw error;
  } finally {
    session.endSession();
  }
}

export { createPayment };
