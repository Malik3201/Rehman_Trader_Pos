import mongoose from 'mongoose';

const pendingProductSchema = new mongoose.Schema(
  {
    rawName: {
      type: String,
      required: true,
      trim: true,
    },
    suggestedFields: {
      name: {
        type: String,
        trim: true,
      },
      unitType: {
        type: String,
        enum: ['pcs', 'kg', 'pack', 'carton', 'case'],
      },
      costPrice: {
        type: Number,
        min: 0,
      },
      retailPrice: {
        type: Number,
        min: 0,
      },
      wholesalePrice: {
        type: Number,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'merged', 'created'],
      default: 'pending',
    },
    mergedIntoProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

pendingProductSchema.index({ status: 1, createdAt: -1 });
pendingProductSchema.index({ rawName: 1 });

export default mongoose.model('PendingProduct', pendingProductSchema);
