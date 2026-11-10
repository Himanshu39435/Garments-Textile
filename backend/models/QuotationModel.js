import mongoose from 'mongoose';

/** `expired` is not stored: an approved quote past its validity date is reported as expired (see QuotationService). */
export const QUOTATION_STATUSES = ['requested', 'approved', 'rejected', 'cancelled', 'converted'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String, sku: String, unit: String, hsnCode: String,
    gstPercent: Number,
    quantity: { type: Number, required: true, min: 1 },
    listPrice: Number, // catalogue price per metre for this quantity when the request or approval was made
    requestedPrice: Number, // optional target price from the customer
    quotedPrice: Number, // set by an admin on approval (per metre, before discount and GST)
  },
  { _id: false },
);

const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { name: String, email: String, phone: String, companyName: String, gstin: String },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    notes: { type: String, maxlength: 1000 },
    requiredBy: Date,
    status: { type: String, enum: QUOTATION_STATUSES, default: 'requested', index: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 50 },
    shippingCharge: { type: Number, min: 0 },
    validUntil: Date, // end of that day, India time
    adminNote: { type: String, maxlength: 500 }, // message to the customer shown with the quote
    rejectionReason: String,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    convertedAt: Date,
    statusHistory: [{ _id: false, status: String, at: Date, note: String, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  },
  { timestamps: true },
);

quotationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Quotation', quotationSchema);
