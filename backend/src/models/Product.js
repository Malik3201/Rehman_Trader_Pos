import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    unitType: {
      type: String,
      enum: ['pcs', 'kg', 'pack', 'carton', 'case'],
      required: true,
    },
    packSize: {
      type: Number,
      default: 1,
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    retailPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    wholesalePrice: {
      type: Number,
      min: 0,
    },
    stockQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', productSchema);
