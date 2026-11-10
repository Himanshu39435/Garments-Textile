import mongoose from 'mongoose';

/** One row per payment attempt. Razorpay ids and the verified signature are kept for reconciliation. */
const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['razorpay', 'bank_transfer'], required: true },
    amount: { type: Number, required: true }, // INR
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
    reference: String, // bank transfer UTR / refund reference entered by an admin
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: String,
    paidAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model('Payment', paymentSchema);
