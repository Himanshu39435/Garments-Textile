import mongoose from 'mongoose';

export const FABRIC_TYPES = ['cotton', 'printed', 'embroidered', 'blended'];
export const PRODUCT_STATUSES = ['active', 'draft', 'archived'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    fabricType: { type: String, enum: FABRIC_TYPES, required: true },
    composition: { type: String, trim: true, required: true }, // e.g. "100% Cotton"
    gsm: { type: Number, required: true, min: 10, max: 1000 },
    width: { type: Number, required: true, min: 10, max: 120 }, // inches
    colors: [{ _id: false, name: { type: String, required: true, trim: true }, hex: { type: String, required: true } }],
    images: [{ _id: false, url: { type: String, required: true }, publicId: String, alt: String }],
    swatch: { type: { type: String }, color: String, accent: String }, // fallback texture while images is empty
    price: { type: Number, required: true, min: 0 }, // INR per metre, excl. GST
    bulkPricing: [{ _id: false, minQty: { type: Number, required: true, min: 1 }, price: { type: Number, required: true, min: 0 } }],
    unit: { type: String, default: 'm' },
    hsnCode: { type: String, trim: true, match: /^\d{4,8}$/ }, // printed on GST invoices when set
    gstPercent: { type: Number, min: 0, max: 28 }, // falls back to DEFAULT_GST_PERCENT when unset
    moq: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 100, min: 0 },
    specifications: [{ _id: false, label: { type: String, required: true }, value: { type: String, required: true } }],
    tags: [{ type: String, lowercase: true, trim: true }],
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active', index: true },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });

/** Stock label for lean() results, which do not run virtuals. Keep in sync with the virtual below. */
export function getStockStatus({ stock, lowStockThreshold = 100 }) {
  if (stock <= 0) return 'out_of_stock';
  return stock <= lowStockThreshold ? 'low_stock' : 'in_stock';
}

productSchema.virtual('stockStatus').get(function stockStatus() {
  return getStockStatus(this);
});
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
