import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_METHODS = ['razorpay', 'bank_transfer'];
export const PAYMENT_STATUSES = ['pending', 'awaiting_transfer', 'paid', 'failed', 'refunded'];

const addressSnapshot = new mongoose.Schema(
  { fullName: String, companyName: String, phone: String, line1: String, line2: String, city: String, state: String, stateCode: String, pincode: String },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String, slug: String, sku: String, unit: String, hsnCode: String,
    image: String, swatch: { type: { type: String }, color: String, accent: String },
    quantity: Number, unitPrice: Number, lineSubtotal: Number, gstPercent: Number, gstAmount: Number,
  },
  { _id: false },
);

/** An order is a snapshot: names, prices and addresses are copied so later catalogue edits never change history. */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { name: String, email: String, phone: String, companyName: String, gstin: String },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: addressSnapshot,
    billingAddress: addressSnapshot,
    pricing: {
      subtotal: Number, shipping: Number, gst: Number, total: Number,
      taxType: { type: String, enum: ['cgst_sgst', 'igst'] }, cgst: Number, sgst: Number, igst: Number,
    },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    razorpayOrderId: { type: String, index: true, sparse: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' }, // set when the order was placed from a quotation
    quoteNumber: String,
    invoiceNumber: { type: String, unique: true, sparse: true }, // assigned when payment is confirmed; sequential per financial year
    invoiceDate: Date,
    statusHistory: [{ _id: false, status: String, at: Date, note: String, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    shipment: { courier: String, trackingNumber: String, trackingUrl: String, shippedAt: Date, deliveredAt: Date }, // filled by admin in Phase 8
    notes: { type: String, maxlength: 500 },
    paidAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
