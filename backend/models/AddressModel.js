import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true, maxlength: 40 }, // e.g. "Warehouse", "Head office"
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    companyName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true, maxlength: 160 },
    line2: { type: String, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true },
    stateCode: { type: String, required: true, match: /^\d{2}$/ }, // GST state code, drives CGST/SGST vs IGST
    pincode: { type: String, required: true, match: /^[1-9]\d{5}$/ },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('Address', addressSchema);
