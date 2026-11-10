/**
 * Replaces the sample catalogue with Narang Textile's wholesale garment range.
 * Images are local catalogue illustrations and can be replaced from the admin panel.
 * Usage: npm run seed:products
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/databaseConfig.js';
import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';

const photo = (url, alt) => ({ url, alt });
const PNT_IMAGES = [
  ['/catalogue/pnt-1.png', 'PNT wide-leg trouser front view'],
  ['/catalogue/pnt-2.png', 'PNT relaxed trouser detail'],
  ['/catalogue/pnt-3.png', 'PNT wide-leg trouser styled view'],
  ['/catalogue/pnt-4.png', 'PNT casual trouser styled view'],
];
const KURTI_IMAGES = [
  ['/catalogue/kurti-1.png', 'Printed blue Kurti front view'],
  ['/catalogue/kurti-2.png', 'Blue embroidered Kurti styled view'],
  ['/catalogue/kurti-3.png', 'Blue button-front Kurti front view'],
  ['/catalogue/kurti-4.png', 'Floral blue Kurti styled view'],
];
const imageFor = (category) => {
  if (category === 'pnt') return PNT_IMAGES[0][0];
  if (category === 'kurti') return KURTI_IMAGES[0][0];
  if (category === 'kurti-set') return '/catalogue/kurti-set-photo.png';
  if (category === 'co-ord-set') return '/catalogue/kurti-set-photo.png';
  if (category === 'frock') return '/catalogue/kurti-photo.png';
  return `/catalogue/${category}.svg`;
};

const CATEGORIES = [
  { slug: 'pnt', name: 'PNT', description: 'Wholesale PNT manufactured with in-house cutting, stitching and finishing.', image: photo(imageFor('pnt'), 'Wholesale PNT collection'), swatch: { type: 'cotton', color: '#CBBFA3', accent: '#8F7647' } },
  { slug: 'kurti', name: 'Kurti', description: 'Wholesale Kurtis developed for repeat collections and retail-ready size mixes.', image: photo(imageFor('kurti'), 'Wholesale Kurti collection'), swatch: { type: 'printed', color: '#E7C9C0', accent: '#8F7647' } },
  { slug: 'kp-kurti-pant', name: 'KP (Kurti Pant)', description: 'Coordinated two-piece wholesale set with one Kurti and matching Pant.', image: photo(imageFor('kp-kurti-pant'), 'KP Kurti Pant collection'), swatch: { type: 'printed', color: '#D7C6B4', accent: '#8F7647' } },
  { slug: 'kurti-set', name: 'Kurti Set (3 Pcs)', description: 'Complete 3-piece set: Kurti, PNT and Dupatta, packed for wholesale dispatch.', image: photo(imageFor('kurti-set'), 'Three piece Kurti Set collection'), swatch: { type: 'embroidered', color: '#F3E8D0', accent: '#B89A65' } },
  { slug: 'co-ord-set', name: 'Co-ord Set', description: 'Coordinated wholesale sets with matching tops and bottoms for everyday and occasion collections.', image: photo(imageFor('co-ord-set'), 'Co-ord Set collection'), swatch: { type: 'printed', color: '#D7C6B4', accent: '#8F7647' } },
  { slug: 'frock', name: 'Frock', description: 'Comfortable and retail-ready frocks for seasonal and everyday wholesale collections.', image: photo(imageFor('frock'), 'Frock collection'), swatch: { type: 'printed', color: '#E7C9C0', accent: '#8F7647' } },
  { slug: 'cotton-collection', name: 'Cotton Collection', description: 'Breathable cotton wholesale styles for everyday collections.', image: photo(imageFor('cotton'), 'Cotton wholesale collection'), swatch: { type: 'cotton', color: '#EFE9DA', accent: '#B89A65' } },
  { slug: 'festive-collection', name: 'Festive Collection', description: 'Embroidered and occasion-ready styles for seasonal wholesale buying.', image: photo(imageFor('festive'), 'Festive wholesale collection'), swatch: { type: 'embroidered', color: '#E7C9C0', accent: '#8F7647' } },
].map((category, sortOrder) => ({ ...category, sortOrder }));

const COLORS = {
  ivory: { name: 'Ivory', hex: '#EFE9DA' },
  rose: { name: 'Rose', hex: '#E7C9C0' },
  navy: { name: 'Navy', hex: '#142B3B' },
  sage: { name: 'Sage', hex: '#7B8A7A' },
  black: { name: 'Black', hex: '#252525' },
  mustard: { name: 'Mustard', hex: '#C69A35' },
};

const bulkPricing = (price) => [
  { minQty: 100, price: Math.round(price * 0.95) },
  { minQty: 500, price: Math.round(price * 0.9) },
];

const product = (category, fabricType, name, sku, composition, price, moq, colors, description, finish, sizes, flags, photoIndex) => {
  const primaryImage = imageFor(category);
  return {
    category,
    fabricType,
    name,
    sku,
    composition,
    gsm: 120,
    width: 44,
    price,
    moq,
    stock: 1000,
    colors,
    images: category === 'pnt'
      ? [photo(PNT_IMAGES[photoIndex % PNT_IMAGES.length][0], PNT_IMAGES[photoIndex % PNT_IMAGES.length][1])]
      : category === 'kurti'
        ? [photo(KURTI_IMAGES[photoIndex % KURTI_IMAGES.length][0], KURTI_IMAGES[photoIndex % KURTI_IMAGES.length][1])]
      : [photo(primaryImage, name)],
    unit: 'piece',
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    bulkPricing: bulkPricing(price),
    description,
    specifications: [
      { label: 'Manufacturing', value: 'In-house cutting and stitching' },
      { label: 'Finish', value: finish },
      { label: 'Size range', value: sizes },
      { label: 'Dispatch', value: 'Wholesale packing' },
    ],
    tags: [category, 'wholesale', 'manufacturing', ...name.toLowerCase().split(' ')].slice(0, 8),
    isBestSeller: flags.includes('best'),
    isNewArrival: flags.includes('new'),
    salesCount: flags.includes('best') ? 300 : 25,
    lowStockThreshold: 100,
  };
};

const PRODUCTS = [
  product('pnt', 'cotton', 'Classic Cotton PNT', 'NT-PNT-001', 'Cotton blend', 299, 50, [COLORS.black, COLORS.navy, COLORS.ivory], 'Comfortable wholesale PNT with clean stitching and a dependable everyday fit.', 'Straight finish', 'M to 3XL', ['best'], 0),
  product('pnt', 'blended', 'Straight Fit PNT', 'NT-PNT-002', 'Rayon blend', 349, 50, [COLORS.black, COLORS.sage, COLORS.navy], 'Retail-ready straight-fit PNT for coordinated Kurti collections.', 'Straight fit', 'M to 3XL', ['new'], 1),
  product('pnt', 'cotton', 'Comfort Cotton PNT', 'NT-PNT-003', '100% cotton', 329, 100, [COLORS.ivory, COLORS.black, COLORS.mustard], 'Soft cotton PNT designed for everyday wholesale wear.', 'Soft wash finish', 'M to 4XL', [], 2),
  product('pnt', 'blended', 'Premium Slim PNT', 'NT-PNT-004', 'Viscose blend', 399, 50, [COLORS.black, COLORS.navy], 'Clean slim silhouette for premium coordinated collections.', 'Premium finish', 'M to 3XL', ['new'], 3),
  product('kurti', 'printed', 'Printed Daily Kurti', 'NT-KUR-001', 'Cotton rayon', 399, 50, [COLORS.rose, COLORS.sage, COLORS.ivory], 'Versatile printed Kurti made for regular wholesale replenishment.', 'Soft printed finish', 'M to 3XL', ['best'], 4),
  product('kurti', 'printed', 'Floral Rayon Kurti', 'NT-KUR-002', 'Rayon blend', 449, 50, [COLORS.rose, COLORS.mustard, COLORS.navy], 'Fluid floral Kurti with a retail-friendly drape and finish.', 'Digital floral print', 'M to 3XL', ['new'], 5),
  product('kurti', 'embroidered', 'Embroidered Kurti', 'NT-KUR-003', 'Viscose blend', 549, 50, [COLORS.ivory, COLORS.rose, COLORS.navy], 'Detailed embroidered Kurti for festive and occasion-led collections.', 'Thread embroidery', 'M to 3XL', ['best'], 6),
  product('kurti', 'cotton', 'Cotton Straight Kurti', 'NT-KUR-004', '100% cotton', 425, 100, [COLORS.ivory, COLORS.sage, COLORS.mustard], 'Breathable straight Kurti for high-volume everyday wholesale sales.', 'Breathable cotton', 'M to 4XL', [], 7),
  product('kurti', 'printed', 'Block Print Kurti', 'NT-KUR-005', 'Cotton rayon', 475, 50, [COLORS.rose, COLORS.ivory, COLORS.navy], 'Statement block-print style for seasonal retail collections.', 'Block print', 'M to 3XL', ['new'], 8),
  product('kurti', 'embroidered', 'Festive Neckline Kurti', 'NT-KUR-006', 'Viscose blend', 599, 50, [COLORS.mustard, COLORS.rose, COLORS.navy], 'Occasion-ready Kurti with a detailed neckline and premium finish.', 'Embroidered neckline', 'M to 3XL', ['best'], 9),
  product('kp-kurti-pant', 'printed', 'Printed KP Kurti Pant Set', 'NT-KP-001', 'Cotton rayon blend', 699, 50, [COLORS.rose, COLORS.sage, COLORS.navy], 'Coordinated two-piece set with printed Kurti and matching Pant for wholesale collections.', 'Printed two-piece set', 'M to 3XL', ['best'], 10),
  product('kp-kurti-pant', 'cotton', 'Cotton KP Kurti Pant Set', 'NT-KP-002', '100% cotton', 749, 100, [COLORS.ivory, COLORS.sage, COLORS.mustard], 'Breathable Kurti and Pant set designed for everyday wholesale sales.', 'Cotton comfort finish', 'M to 4XL', ['new'], 11),
  product('kp-kurti-pant', 'embroidered', 'Embroidered KP Kurti Pant Set', 'NT-KP-003', 'Viscose blend', 899, 50, [COLORS.ivory, COLORS.rose, COLORS.navy], 'Premium two-piece Kurti Pant set with detailed embroidery for festive collections.', 'Embroidered finish', 'M to 3XL', ['new'], 12),
  product('kurti-set', 'printed', 'Everyday Kurti Set - 3 Piece', 'NT-SET-001', 'Cotton rayon blend', 899, 50, [COLORS.rose, COLORS.sage, COLORS.navy], 'Complete set with Kurti, PNT and Dupatta, coordinated for wholesale sales.', 'Printed 3-piece set', 'M to 3XL', ['best'], 13),
  product('kurti-set', 'printed', 'Floral Kurti Set - 3 Piece', 'NT-SET-002', 'Rayon blend', 999, 50, [COLORS.rose, COLORS.mustard, COLORS.ivory], 'Floral Kurti, matching PNT and Dupatta for a complete retail look.', 'Floral print', 'M to 3XL', ['new'], 14),
  product('kurti-set', 'embroidered', 'Festive Kurti Set - 3 Piece', 'NT-SET-003', 'Viscose blend', 1199, 50, [COLORS.ivory, COLORS.rose, COLORS.navy], 'Premium 3-piece set with Kurti, PNT and Dupatta for festive collections.', 'Embroidered finish', 'M to 3XL', ['best'], 15),
  product('kurti-set', 'cotton', 'Cotton Comfort Set - 3 Piece', 'NT-SET-004', '100% cotton', 949, 100, [COLORS.ivory, COLORS.sage, COLORS.mustard], 'Breathable cotton Kurti Set for everyday wholesale programmes.', 'Cotton comfort finish', 'M to 4XL', [], 16),
  product('kurti-set', 'embroidered', 'Premium Occasion Set - 3 Piece', 'NT-SET-005', 'Viscose blend', 1399, 50, [COLORS.mustard, COLORS.rose, COLORS.navy], 'Premium coordinated set for occasion-led and festive wholesale buying.', 'Premium embroidery', 'M to 3XL', ['new'], 17),
  product('co-ord-set', 'printed', 'Everyday Printed Co-ord Set', 'NT-CO-ORD-001', 'Cotton rayon blend', 899, 50, [COLORS.rose, COLORS.sage, COLORS.navy], 'Matching top and bottom set designed for easy wholesale merchandising.', 'Soft printed finish', 'M to 3XL', ['new'], 18),
  product('frock', 'printed', 'Floral Rayon Frock', 'NT-FROCK-001', 'Rayon blend', 649, 50, [COLORS.rose, COLORS.mustard, COLORS.ivory], 'Comfortable floral frock with a retail-friendly drape for everyday collections.', 'Floral print', 'M to 3XL', ['best'], 19),
  product('cotton-collection', 'cotton', 'Cotton Everyday Kurti', 'NT-COT-001', '100% cotton', 425, 100, [COLORS.ivory, COLORS.sage, COLORS.mustard], 'Breathable cotton Kurti for dependable everyday wholesale collections.', 'Cotton comfort finish', 'M to 4XL', ['best'], 18),
  product('festive-collection', 'embroidered', 'Festive Embroidery Set', 'NT-FST-001', 'Viscose blend', 1299, 50, [COLORS.rose, COLORS.mustard, COLORS.navy], 'Occasion-ready coordinated set with premium embroidery for festive buying.', 'Premium embroidery', 'M to 3XL', ['new'], 21),
];

async function seed() {
  await connectDatabase();
  await Product.deleteMany({});
  await Category.deleteMany({});

  const idBySlug = {};
  for (const category of CATEGORIES) {
    const doc = await Category.create(category);
    idBySlug[category.slug] = doc._id;
  }

  for (const item of PRODUCTS) {
    const { category, ...rest } = item;
    await Product.create({ ...rest, category: idBySlug[category], status: 'active' });
  }
  console.log(`Replaced catalogue with ${CATEGORIES.length} categories and ${PRODUCTS.length} products, with images.`);
}

seed().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
