import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import PurchaseDraft from '../models/PurchaseDraft.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import PendingProduct from '../models/PendingProduct.js';
import { logger } from '../utils/logger.js';

/**
 * Approve purchase draft and create final purchase
 */
async function approvePurchaseDraft(draftId, approvalData, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const draft = await PurchaseDraft.findById(draftId).session(session);
    if (!draft) {
      const err = new Error('Purchase draft not found');
      err.statusCode = 404;
      err.errorCode = 'DRAFT_NOT_FOUND';
      throw err;
    }

    if (draft.status !== 'draft') {
      const err = new Error(`Draft is already ${draft.status}`);
      err.statusCode = 400;
      err.errorCode = 'DRAFT_ALREADY_PROCESSED';
      throw err;
    }

    const { mappingDecisions } = approvalData;
    const purchaseItems = [];
    let totalCost = 0;

    // Process each item based on mapping decisions
    for (let i = 0; i < draft.items.length; i++) {
      const draftItem = draft.items[i];
      const decision = mappingDecisions[i] || {};

      let productId;
      let nameSnapshot;
      let qty = draftItem.qty;
      let unitCost = draftItem.unitCost;
      let lineTotal = draftItem.lineTotal || qty * unitCost;

      if (decision.action === 'use_existing') {
        // Use existing product
        productId = decision.productId || draftItem.matchedProductId;
        if (!productId) {
          throw new Error(`Product ID required for item: ${draftItem.rawName}`);
        }
        const product = await Product.findById(productId).session(session);
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }
        nameSnapshot = product.name;
      } else if (decision.action === 'create_new') {
        // Create new product
        const productFields = decision.productFields || {};
        const newProduct = new Product({
          name: productFields.name || draftItem.rawName,
          unitType: productFields.unitType || draftItem.unit || 'pcs',
          costPrice: productFields.costPrice || unitCost,
          retailPrice: productFields.retailPrice || unitCost * 1.5,
          wholesalePrice: productFields.wholesalePrice || unitCost * 1.3,
          stockQty: 0,
          isActive: true,
        });
        await newProduct.save({ session });
        productId = newProduct._id;
        nameSnapshot = newProduct.name;

        // Update pending product if exists
        if (draftItem.pendingProductId) {
          await PendingProduct.findByIdAndUpdate(
            draftItem.pendingProductId,
            {
              status: 'created',
              mergedIntoProductId: productId,
            },
            { session }
          );
        }
      } else if (decision.action === 'merge_pending') {
        // Merge pending product into existing
        const pendingProductId = decision.pendingProductId || draftItem.pendingProductId;
        productId = decision.productId;

        if (!pendingProductId || !productId) {
          throw new Error('Both pendingProductId and productId required for merge');
        }

        const product = await Product.findById(productId).session(session);
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }
        nameSnapshot = product.name;

        // Update pending product
        await PendingProduct.findByIdAndUpdate(
          pendingProductId,
          {
            status: 'merged',
            mergedIntoProductId: productId,
          },
          { session }
        );
      } else {
        // Default: use matched product or throw error
        if (draftItem.matchedProductId) {
          productId = draftItem.matchedProductId;
          const product = await Product.findById(productId).session(session);
          nameSnapshot = product.name;
        } else {
          throw new Error(`No mapping decision for item: ${draftItem.rawName}`);
        }
      }

      purchaseItems.push({
        productId,
        nameSnapshot,
        qty,
        unitCost,
        lineTotal,
      });

      totalCost += lineTotal;
    }

    // Create purchase
    const purchase = new Purchase({
      supplierId: null, // Can be set later if supplier is matched
      invoiceNumber: null,
      items: purchaseItems,
      totalCost,
      createdBy: userId,
      source: 'ocr_import',
    });

    // Update stock and create ledger entries
    for (const item of purchaseItems) {
      const product = await Product.findById(item.productId).session(session);
      const qtyChange = item.qty;

      product.stockQty += qtyChange;
      product.costPrice = item.unitCost; // Update last purchase price
      await product.save({ session });

      await StockLedger.create(
        [
          {
            productId: product._id,
            type: 'purchase',
            refId: purchase._id,
            qtyChange,
            stockAfter: product.stockQty,
            createdBy: userId,
          },
        ],
        { session }
      );
    }

    await purchase.save({ session });

    // Update draft status
    draft.status = 'approved';
    draft.approvedBy = userId;
    draft.approvedAt = new Date();
    await draft.save({ session });

    await session.commitTransaction();

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplierId', 'name phone')
      .populate('createdBy', 'name phone')
      .lean();

    logger.info(`Approved purchase draft ${draftId}, created purchase ${purchase._id}`);
    return populatedPurchase;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error approving purchase draft', error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get purchases with filters
 */
async function getPurchases(filters = {}) {
  const { from, to, page = 1, limit = 20 } = filters;

  const query = {};

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

  const [purchases, total] = await Promise.all([
    Purchase.find(query)
      .populate('supplierId', 'name phone')
      .populate('createdBy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Purchase.countDocuments(query),
  ]);

  return {
    purchases,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get purchase by ID
 */
async function getPurchaseById(purchaseId) {
  const purchase = await Purchase.findById(purchaseId)
    .populate('supplierId', 'name phone address')
    .populate('createdBy', 'name phone')
    .lean();

  if (!purchase) {
    const err = new Error('Purchase not found');
    err.statusCode = 404;
    err.errorCode = 'PURCHASE_NOT_FOUND';
    throw err;
  }

  return purchase;
}

export { approvePurchaseDraft, getPurchases, getPurchaseById };
