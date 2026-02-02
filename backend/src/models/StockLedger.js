import mongoose from 'mongoose';

const stockLedgerSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['sale', 'purchase', 'adjustment'],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    qtyChange: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

stockLedgerSchema.index({ productId: 1, createdAt: -1 });
stockLedgerSchema.index({ type: 1, refId: 1 });

export default mongoose.model('StockLedger', stockLedgerSchema);
