import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    method: {
      type: String,
      enum: ['cash', 'bank', 'other'],
      default: 'cash',
    },
    note: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ customerId: 1, createdAt: -1 });
paymentSchema.index({ receivedBy: 1 });

export default mongoose.model('Payment', paymentSchema);
