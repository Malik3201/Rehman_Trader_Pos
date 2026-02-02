import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    nameSnapshot: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Purchase must have at least one item',
      },
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['manual', 'ocr_import'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index({ supplierId: 1, createdAt: -1 });
purchaseSchema.index({ createdBy: 1 });

export default mongoose.model('Purchase', purchaseSchema);
