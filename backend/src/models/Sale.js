import mongoose from 'mongoose';
import saleItemSchema from './SaleItem.js';

const saleSchema = new mongoose.Schema(
  {
    saleType: {
      type: String,
      enum: ['retail', 'wholesale'],
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Sale must have at least one item',
      },
    },
    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank', 'other'],
      default: 'cash',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ledgerEffect: {
      previousBalance: {
        type: Number,
        default: 0,
      },
      addedToBalance: {
        type: Number,
        default: 0,
      },
      reducedByPayment: {
        type: Number,
        default: 0,
      },
      newBalance: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

saleSchema.index({ customerId: 1, createdAt: -1 });
saleSchema.index({ saleType: 1, createdAt: -1 });
saleSchema.index({ createdBy: 1 });

export default mongoose.model('Sale', saleSchema);
