import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import StockLedger from '../models/StockLedger.js';
import { applyWholesaleSale } from './ledgerService.js';
import { logger } from '../utils/logger.js';

/**
 * Create retail sale (walk-in customer)
 */
async function createRetailSale(saleData, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentReceived = 0, paymentMethod = 'cash', notes } = saleData;

    // Validate products and calculate totals
    const saleItems = [];
    let subTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product || !product.isActive) {
        const err = new Error(`Product ${item.productId} not found or inactive`);
        err.statusCode = 404;
        err.errorCode = 'PRODUCT_NOT_FOUND';
        throw err;
      }

      if (product.stockQty < item.qty) {
        const err = new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQty}, Requested: ${item.qty}`);
        err.statusCode = 400;
        err.errorCode = 'INSUFFICIENT_STOCK';
        throw err;
      }

      const unitPrice = product.retailPrice;
      const lineTotal = item.qty * unitPrice;
      subTotal += lineTotal;

      saleItems.push({
        productId: product._id,
        nameSnapshot: product.name,
        unitTypeSnapshot: product.unitType,
        qty: item.qty,
        unitPrice,
        lineTotal,
      });
    }

    const discount = saleData.discount || 0;
    const grandTotal = subTotal - discount;

    // Create sale
    const sale = new Sale({
      saleType: 'retail',
      customerId: null,
      items: saleItems,
      subTotal,
      discount,
      grandTotal,
      paymentReceived,
      paymentMethod,
      notes,
      createdBy: userId,
      ledgerEffect: {
        previousBalance: 0,
        addedToBalance: 0,
        reducedByPayment: 0,
        newBalance: 0,
      },
    });

    // Update stock and create ledger entries
    for (let i = 0; i < items.length; i++) {
      const product = await Product.findById(items[i].productId).session(session);
      const qtyChange = -items[i].qty; // Negative for sale

      product.stockQty += qtyChange;
      if (product.stockQty < 0) {
        const err = new Error(`Stock cannot go negative for ${product.name}`);
        err.statusCode = 400;
        err.errorCode = 'INVALID_STOCK';
        throw err;
      }
      await product.save({ session });

      await StockLedger.create(
        [
          {
            productId: product._id,
            type: 'sale',
            refId: sale._id,
            qtyChange,
            stockAfter: product.stockQty,
            createdBy: userId,
          },
        ],
        { session }
      );
    }

    await sale.save({ session });
    await session.commitTransaction();

    const populatedSale = await Sale.findById(sale._id)
      .populate('createdBy', 'name phone')
      .lean();

    logger.info(`Retail sale created: ${sale._id}`);
    return populatedSale;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error creating retail sale', error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Create wholesale sale (with customer)
 */
async function createWholesaleSale(saleData, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerId, items, paymentReceived = 0, paymentMethod = 'cash', notes } = saleData;

    if (!customerId) {
      const err = new Error('Customer ID is required for wholesale sale');
      err.statusCode = 400;
      err.errorCode = 'CUSTOMER_REQUIRED';
      throw err;
    }

    // Validate products and calculate totals
    const saleItems = [];
    let subTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product || !product.isActive) {
        const err = new Error(`Product ${item.productId} not found or inactive`);
        err.statusCode = 404;
        err.errorCode = 'PRODUCT_NOT_FOUND';
        throw err;
      }

      if (product.stockQty < item.qty) {
        const err = new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQty}, Requested: ${item.qty}`);
        err.statusCode = 400;
        err.errorCode = 'INSUFFICIENT_STOCK';
        throw err;
      }

      // Use provided unitPrice or fallback to wholesalePrice or retailPrice
      const unitPrice = item.unitPrice ?? product.wholesalePrice ?? product.retailPrice;
      const lineTotal = item.qty * unitPrice;
      subTotal += lineTotal;

      saleItems.push({
        productId: product._id,
        nameSnapshot: product.name,
        unitTypeSnapshot: product.unitType,
        qty: item.qty,
        unitPrice,
        lineTotal,
      });
    }

    const discount = saleData.discount || 0;
    const grandTotal = subTotal - discount;

    // Update customer balance
    const ledgerEffect = await applyWholesaleSale(session, customerId, grandTotal, paymentReceived);

    // Create sale
    const sale = new Sale({
      saleType: 'wholesale',
      customerId,
      items: saleItems,
      subTotal,
      discount,
      grandTotal,
      paymentReceived,
      paymentMethod,
      notes,
      createdBy: userId,
      ledgerEffect,
    });

    // Update stock and create ledger entries
    for (let i = 0; i < items.length; i++) {
      const product = await Product.findById(items[i].productId).session(session);
      const qtyChange = -items[i].qty; // Negative for sale

      product.stockQty += qtyChange;
      if (product.stockQty < 0) {
        const err = new Error(`Stock cannot go negative for ${product.name}`);
        err.statusCode = 400;
        err.errorCode = 'INVALID_STOCK';
        throw err;
      }
      await product.save({ session });

      await StockLedger.create(
        [
          {
            productId: product._id,
            type: 'sale',
            refId: sale._id,
            qtyChange,
            stockAfter: product.stockQty,
            createdBy: userId,
          },
        ],
        { session }
      );
    }

    await sale.save({ session });
    await session.commitTransaction();

    const populatedSale = await Sale.findById(sale._id)
      .populate('customerId', 'name shopName phone')
      .populate('createdBy', 'name phone')
      .lean();

    logger.info(`Wholesale sale created: ${sale._id} for customer ${customerId}`);
    return populatedSale;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error creating wholesale sale', error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get sales with filters
 */
async function getSales(filters = {}) {
  const { type, from, to, customerId, page = 1, limit = 20 } = filters;

  const query = {};

  if (type) {
    query.saleType = type;
  }

  if (customerId) {
    query.customerId = customerId;
  }

  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    Sale.find(query)
      .populate('customerId', 'name shopName phone')
      .populate('createdBy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Sale.countDocuments(query),
  ]);

  return {
    sales,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get sale by ID
 */
async function getSaleById(saleId) {
  const sale = await Sale.findById(saleId)
    .populate('customerId', 'name shopName phone address')
    .populate('createdBy', 'name phone')
    .lean();

  if (!sale) {
    const err = new Error('Sale not found');
    err.statusCode = 404;
    err.errorCode = 'SALE_NOT_FOUND';
    throw err;
  }

  return sale;
}

export { createRetailSale, createWholesaleSale, getSales, getSaleById };
