import mongoose from 'mongoose';

const purchaseDraftItemSchema = new mongoose.Schema(
  {
    rawName: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      required: true,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      min: 0,
    },
    matchedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    pendingProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PendingProduct',
      default: null,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const purchaseDraftSchema = new mongoose.Schema(
  {
    supplierNameRaw: {
      type: String,
      trim: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    imagePath: {
      type: String,
      trim: true,
    },
    items: {
      type: [purchaseDraftItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Draft must have at least one item',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'rejected'],
      default: 'draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

purchaseDraftSchema.index({ status: 1, createdAt: -1 });
purchaseDraftSchema.index({ createdBy: 1 });

export default mongoose.model('PurchaseDraft', purchaseDraftSchema);
