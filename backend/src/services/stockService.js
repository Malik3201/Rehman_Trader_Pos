import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import { logger } from '../utils/logger.js';

/**
 * Adjust stock manually (admin only)
 */
async function adjustStock(adjustmentData, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, qtyChange, reason } = adjustmentData;

    const product = await Product.findById(productId).session(session);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      err.errorCode = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    const previousStock = product.stockQty;
    const newStock = previousStock + qtyChange;
    if (newStock < 0) {
      const err = new Error(`Stock cannot go negative. Current: ${previousStock}, Change: ${qtyChange}`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_STOCK';
      throw err;
    }

    product.stockQty = newStock;
    await product.save({ session });

    await StockLedger.create(
      [
        {
          productId: product._id,
          type: 'adjustment',
          refId: null,
          qtyChange,
          stockAfter: newStock,
          createdBy: userId,
          notes: reason,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    logger.info(`Stock adjusted: Product ${productId}, Change: ${qtyChange}, New Stock: ${newStock}`);
    return {
      productId: product._id,
      previousStock,
      newStock,
      qtyChange,
    };
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error adjusting stock', error);
    throw error;
  } finally {
    session.endSession();
  }
}

export { adjustStock };
