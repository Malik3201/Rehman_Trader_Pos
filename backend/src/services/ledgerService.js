import Customer from '../models/Customer.js';
import { logger } from '../utils/logger.js';

/**
 * Apply wholesale sale to customer balance
 * @param {Object} session - MongoDB session for transaction
 * @param {string} customerId - Customer ID
 * @param {number} saleGrandTotal - Grand total of the sale
 * @param {number} paymentReceived - Payment received at sale time
 * @returns {Object} { previousBalance, added, reduced, newBalance }
 */
async function applyWholesaleSale(session, customerId, saleGrandTotal, paymentReceived) {
  const customer = await Customer.findById(customerId).session(session);
  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    err.errorCode = 'CUSTOMER_NOT_FOUND';
    throw err;
  }

  const previousBalance = customer.currentBalance;
  const added = saleGrandTotal;
  const reduced = paymentReceived;
  const newBalance = previousBalance + added - reduced;

  customer.currentBalance = newBalance;
  await customer.save({ session });

  logger.info(`Ledger: Customer ${customerId} - Previous: ${previousBalance}, Added: ${added}, Reduced: ${reduced}, New: ${newBalance}`);

  return {
    previousBalance,
    addedToBalance: added,
    reducedByPayment: reduced,
    newBalance,
  };
}

/**
 * Apply standalone payment to customer balance
 * @param {Object} session - MongoDB session for transaction
 * @param {string} customerId - Customer ID
 * @param {number} amount - Payment amount (positive number)
 * @returns {Object} { previousBalance, newBalance }
 */
async function applyPayment(session, customerId, amount) {
  const customer = await Customer.findById(customerId).session(session);
  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    err.errorCode = 'CUSTOMER_NOT_FOUND';
    throw err;
  }

  const previousBalance = customer.currentBalance;
  const newBalance = previousBalance - amount; // Payment reduces balance

  customer.currentBalance = newBalance;
  await customer.save({ session });

  logger.info(`Payment: Customer ${customerId} - Previous: ${previousBalance}, Payment: ${amount}, New: ${newBalance}`);

  return {
    previousBalance,
    newBalance,
  };
}

export { applyWholesaleSale, applyPayment };
