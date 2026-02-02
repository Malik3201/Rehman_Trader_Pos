import Sale from '../models/Sale.js';
import Payment from '../models/Payment.js';

/**
 * Get daily summary report
 */
async function getDailySummary(date) {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const dateFilter = {
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };

  // Get all sales for the day
  const sales = await Sale.find(dateFilter).lean();

  // Calculate totals
  let totalRetailSales = 0;
  let totalWholesaleSales = 0;
  let totalCashReceived = 0;
  let totalCreditAdded = 0;

  const itemQuantities = {}; // { productId: { name, qty } }

  for (const sale of sales) {
    if (sale.saleType === 'retail') {
      totalRetailSales += sale.grandTotal;
    } else {
      totalWholesaleSales += sale.grandTotal;
      totalCreditAdded += sale.ledgerEffect.addedToBalance;
    }

    totalCashReceived += sale.paymentReceived;

    // Track item quantities
    for (const item of sale.items) {
      const productId = item.productId.toString();
      if (!itemQuantities[productId]) {
        itemQuantities[productId] = {
          productId,
          name: item.nameSnapshot,
          qty: 0,
        };
      }
      itemQuantities[productId].qty += item.qty;
    }
  }

  // Get top selling items
  const topItems = Object.values(itemQuantities)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return {
    date: targetDate.toISOString().split('T')[0],
    totalRetailSales,
    totalWholesaleSales,
    totalCashReceived,
    totalCreditAdded,
    topSellingItems: topItems,
  };
}

export { getDailySummary };
