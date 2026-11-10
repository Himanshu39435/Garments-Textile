import Category from '../models/CategoryModel.js';
import Order from '../models/OrderModel.js';
import Product, { getStockStatus } from '../models/ProductModel.js';
import User from '../models/UserModel.js';
import Cart from '../models/CartModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { slugify, uniqueSlug } from '../utils/Slugify.js';
import { deleteImages } from '../services/CloudinaryService.js';

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ID = /^[a-f\d]{24}$/i;
const LIST_FIELDS = 'name slug sku category fabricType price moq stock lowStockThreshold status images swatch isBestSeller isNewArrival gstPercent updatedAt';
const withStock = (p) => ({ ...p, stockStatus: getStockStatus(p) });

/** Whitelists and cleans the fields an admin may set. Unknown fields (such as _id or salesCount) are ignored. */
function cleanInput(b) {
  const data = {
    name: b.name.trim(), sku: b.sku.trim().toUpperCase(), description: (b.description ?? '').trim(), category: b.category, fabricType: b.fabricType,
    composition: b.composition.trim(), gsm: b.gsm, width: b.width, price: b.price, moq: b.moq, stock: b.stock,
    lowStockThreshold: b.lowStockThreshold ?? 100, hsnCode: b.hsnCode || undefined, gstPercent: b.gstPercent ?? undefined,
    bulkPricing: (b.bulkPricing ?? []).map((s) => ({ minQty: s.minQty, price: s.price })),
    colors: (b.colors ?? []).map((c) => ({ name: c.name.trim(), hex: c.hex.toLowerCase() })),
    images: (b.images ?? []).map((i) => ({ url: i.url, publicId: i.publicId, alt: i.alt?.trim() || undefined })),
    specifications: (b.specifications ?? []).map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
    tags: (b.tags ?? []).map((t) => t.trim().toLowerCase()),
    status: b.status ?? 'draft', isBestSeller: b.isBestSeller ?? false, isNewArrival: b.isNewArrival ?? false,
  };
  if (!data.images.length) data.swatch = { type: data.fabricType, color: data.colors[0]?.hex ?? '#E9E3D3', accent: '#B89A65' }; // look-alike texture until a photo exists
  return data;
}

async function assertCategory(id) {
  if (!(await Category.exists({ _id: id }))) throw ApiError.badRequest('That category does not exist');
}

/** GET /api/admin/products: every status, with search, status, category and low-stock filters. */
export async function listProducts(req, res, next) {
  try {
    const { search, status, category, lowStock } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search?.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim().slice(0, 80)), 'i');
      filter.$or = [{ name: pattern }, { sku: pattern }, { slug: pattern }];
    }

    if (lowStock === 'true') { // threshold is per product, so filter in memory (catalogues are small)
      const all = await Product.find({ ...filter, status: 'active' }).select(LIST_FIELDS).populate('category', 'name slug').sort({ stock: 1 }).lean();
      const low = all.filter((p) => p.stock <= p.lowStockThreshold);
      return ApiResponse.ok(res, low.slice((page - 1) * limit, page * limit).map(withStock), 'Products fetched', { page, limit, total: low.length, totalPages: Math.ceil(low.length / limit) });
    }
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).select(LIST_FIELDS).populate('category', 'name slug').sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return ApiResponse.ok(res, products.map(withStock), 'Products fetched', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
}

/** GET /api/admin/products/:id */
export async function getProduct(req, res, next) {
  try {
    const product = ID.test(req.params.id) ? await Product.findById(req.params.id).lean() : null;
    if (!product) throw ApiError.notFound('Product not found');
    return ApiResponse.ok(res, withStock(product));
  } catch (error) { return next(error); }
}

/** POST /api/admin/products */
export async function createProduct(req, res, next) {
  try {
    await assertCategory(req.body.category);
    const data = cleanInput(req.body);
    data.slug = req.body.slug || await uniqueSlug(slugify(data.name), (s) => Product.exists({ slug: s }));
    const clash = await Product.findOne({ $or: [{ sku: data.sku }, { slug: data.slug }] }).select('sku slug').lean();
    if (clash) throw ApiError.conflict(clash.sku === data.sku ? `SKU ${data.sku} is already used by another product` : `The slug "${data.slug}" is already used by another product`);
    const product = await Product.create(data);
    return ApiResponse.created(res, withStock(product.toObject()), 'Product created');
  } catch (error) { return next(error); }
}

/** PUT /api/admin/products/:id. The slug only changes when explicitly sent, so existing links keep working. */
export async function updateProduct(req, res, next) {
  try {
    const product = ID.test(req.params.id) ? await Product.findById(req.params.id) : null;
    if (!product) throw ApiError.notFound('Product not found');
    await assertCategory(req.body.category);

    const previousImages = product.images.map((i) => ({ url: i.url, publicId: i.publicId }));
    const data = cleanInput(req.body);
    const nextSlug = req.body.slug || product.slug;
    const clash = await Product.findOne({ _id: { $ne: product._id }, $or: [{ sku: data.sku }, { slug: nextSlug }] }).select('sku slug').lean();
    if (clash) throw ApiError.conflict(clash.sku === data.sku ? `SKU ${data.sku} is already used by another product` : `The slug "${nextSlug}" is already used by another product`);
    if (!data.swatch) product.swatch = undefined;
    product.set({ ...data, slug: nextSlug });
    await product.save();

    const keep = new Set(product.images.map((i) => i.url));
    await deleteImages(previousImages.filter((i) => !keep.has(i.url))); // remove files the admin took off the product
    return ApiResponse.ok(res, withStock(product.toObject()), 'Product updated');
  } catch (error) { return next(error); }
}

/**
 * DELETE /api/admin/products/:id
 * A product that appears in any order is archived instead (order history needs it). Otherwise it is removed,
 * along with its images and any wishlist or cart entries.
 */
export async function deleteProduct(req, res, next) {
  try {
    const product = ID.test(req.params.id) ? await Product.findById(req.params.id) : null;
    if (!product) throw ApiError.notFound('Product not found');

    if (await Order.exists({ 'items.product': product._id })) {
      product.status = 'archived';
      await product.save();
      return ApiResponse.ok(res, { archived: true }, 'This fabric appears in past orders, so it was archived instead of deleted');
    }
    await User.updateMany({ wishlist: product._id }, { $pull: { wishlist: product._id } });
    for (const cart of await Cart.find({ 'items.product': product._id })) { // plain load-filter-save: behaves the same on every MongoDB-compatible engine
      cart.items = cart.items.filter((i) => String(i.product) !== String(product._id));
      await cart.save();
    }
    await product.deleteOne();
    await deleteImages(product.images);
    return ApiResponse.ok(res, { archived: false }, 'Product deleted');
  } catch (error) { return next(error); }
}
