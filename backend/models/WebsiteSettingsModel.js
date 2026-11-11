import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  { title: { type: String, trim: true, maxlength: 100 }, imageUrl: { type: String, trim: true, maxlength: 500 }, linkUrl: { type: String, trim: true, maxlength: 500 }, isActive: { type: Boolean, default: true } },
  { _id: true },
);

const websiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'narang-textile', unique: true },
    brandName: { type: String, default: 'NARANG TEXTILE', trim: true, maxlength: 120 },
    logoUrl: { type: String, default: '', trim: true, maxlength: 500 },
    email: { type: String, default: '', trim: true, maxlength: 254 },
    phone: { type: String, default: '', trim: true, maxlength: 30 },
    address: { type: String, default: '', trim: true, maxlength: 500 },
    whatsapp: { type: String, default: '', trim: true, maxlength: 30 },
    instagramUrl: { type: String, default: '', trim: true, maxlength: 500 },
    facebookUrl: { type: String, default: '', trim: true, maxlength: 500 },
    youtubeUrl: { type: String, default: '', trim: true, maxlength: 500 },
    shippingCharge: { type: Number, default: 500, min: 0 },
    freeShippingAbove: { type: Number, default: 50000, min: 0 },
    legalBusinessName: { type: String, default: '', trim: true, maxlength: 160 },
    gstin: { type: String, default: '', trim: true, uppercase: true, maxlength: 15 },
    state: { type: String, default: '', trim: true, maxlength: 80 },
    gstRate: { type: Number, default: 5, min: 0, max: 28 },
    hsnCode: { type: String, default: '', trim: true, maxlength: 8 },
    returnPolicy: { type: String, default: '', maxlength: 5000 },
    privacyPolicy: { type: String, default: '', maxlength: 5000 },
    terms: { type: String, default: '', maxlength: 5000 },
    banners: { type: [bannerSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('WebsiteSettings', websiteSettingsSchema);
