/**
 * Business rules for pricing, tax and shipping. Read from env at call time so they can be tuned without code changes.
 * DEFAULTS ARE PLACEHOLDERS: confirm GST rates, shipping rules and bank details with your accountant before launch.
 */
const num = (value, fallback) => (Number.isFinite(Number(value)) && value !== undefined && value !== '' ? Number(value) : fallback);

export const getCommerceConfig = () => ({
  defaultGstPercent: num(process.env.DEFAULT_GST_PERCENT, 5),
  shippingFlatRate: num(process.env.SHIPPING_FLAT_RATE, 500),
  freeShippingThreshold: num(process.env.FREE_SHIPPING_THRESHOLD, 50000),
  sellerStateCode: process.env.SELLER_STATE_CODE || '07', // placeholder: set to your GST registration state
  seller: {
    name: process.env.SELLER_NAME || 'NARANG TEXTILE',
    address: process.env.SELLER_ADDRESS || 'Add registered business address',
    gstin: process.env.SELLER_GSTIN || 'Add GSTIN',
    phone: process.env.SELLER_PHONE || '',
    email: process.env.SELLER_EMAIL || '',
  },
  bankDetails: {
    accountName: process.env.BANK_ACCOUNT_NAME || 'Add account name',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'Add account number',
    ifsc: process.env.BANK_IFSC || 'Add IFSC',
    bankName: process.env.BANK_NAME || 'Add bank name',
  },
});
