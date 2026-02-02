import Sale from '../models/Sale.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';

/**
 * Get customer ledger (combined sales and payments)
 */
async function getCustomerLedger(customerId, filters = {}) {
  const { from, to } = filters;

  // Get customer for opening balance
  const customer = await Customer.findById(customerId).lean();
  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    err.errorCode = 'CUSTOMER_NOT_FOUND';
    throw err;
  }

  const dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) {
      dateFilter.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt.$lte = toDate;
    }
  }

  // Get sales
  const sales = await Sale.find({
    customerId,
    saleType: 'wholesale',
    ...dateFilter,
  })
    .sort({ createdAt: 1 })
    .lean();

  // Get payments
  const payments = await Payment.find({
    customerId,
    ...dateFilter,
  })
    .sort({ createdAt: 1 })
    .lean();

  // Combine and sort by date
  const ledger = [];

  for (const sale of sales) {
    ledger.push({
      type: 'sale',
      id: sale._id,
      date: sale.createdAt,
      description: `Sale #${sale._id.toString().slice(-6)}`,
      debit: sale.grandTotal - sale.paymentReceived, // Credit added
      credit: sale.paymentReceived, // Payment received
      balance: sale.ledgerEffect?.newBalance ?? null,
      details: {
        items: sale.items.length,
        grandTotal: sale.grandTotal,
        paymentReceived: sale.paymentReceived,
      },
    });
  }

  for (const payment of payments) {
    ledger.push({
      type: 'payment',
      id: payment._id,
      date: payment.createdAt,
      description: payment.note || 'Payment received',
      debit: 0,
      credit: payment.amount,
      balance: null, // Will calculate running balance
      details: {
        method: payment.method,
      },
    });
  }

  // Sort by date
  ledger.sort((a, b) => a.date - b.date);

  // Calculate running balance
  // Start with opening balance if no date filter, or calculate from first entry
  let runningBalance = customer.openingBalance;
  
  // If we have a date filter starting after customer creation, we need to calculate balance up to that point
  if (from) {
    // Get balance before the filter date
    const beforeSales = await Sale.find({
      customerId,
      saleType: 'wholesale',
      createdAt: { $lt: new Date(from) },
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    const beforePayments = await Payment.find({
      customerId,
      createdAt: { $lt: new Date(from) },
    }).lean();

    // Calculate balance up to 'from' date
    runningBalance = customer.openingBalance;
    for (const sale of beforeSales.sort((a, b) => a.createdAt - b.createdAt)) {
      runningBalance += sale.grandTotal - sale.paymentReceived;
    }
    for (const payment of beforePayments.sort((a, b) => a.createdAt - b.createdAt)) {
      runningBalance -= payment.amount;
    }
  }

  // Now calculate balance for each entry in the ledger
  for (const entry of ledger) {
    if (entry.type === 'sale') {
      // Sale: add credit (grandTotal - paymentReceived), subtract payment
      runningBalance += entry.debit;
      runningBalance -= entry.credit;
      entry.balance = runningBalance;
    } else {
      // Payment: reduce balance
      runningBalance -= entry.credit;
      entry.balance = runningBalance;
    }
  }

  return ledger;
}

export { getCustomerLedger };
