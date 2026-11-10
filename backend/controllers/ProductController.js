import Product, { getStockStatus } from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  popular: { salesCount: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  name: { name: 1, _id: 1 },
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const csv = (value) => String(value).split(',').map((v) => v.trim()).filter(Boolean);
const withStock = (p) => ({ ...p, stockStatus: getStockStatus(p) });
const LIST_FIELDS = 'name slug sku category fabricType composition gsm width colors images swatch price bulkPricing unit moq stock gstPercent lowStockThreshold isBestSeller isNewArrival';

/** GET /api/products: search, filter, sort and paginate the active catalogue. */
export async function listProducts(req, res, next) {
  try {
    const { search, category, fabric, color, minPrice, maxPrice, flag, sort = 'newest' } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 12, 48);

    const filter = { status: 'active' };

    if (category) {
      const found = await Category.findOne({ slug: category.toLowerCase(), isActive: true }).select('_id').lean();
      if (!found) return ApiResponse.ok(res, [], 'Products fetched', { page, limit, total: 0, totalPages: 0 });
      filter.category = found._id;
    }
    if (fabric) filter.fabricType = { $in: csv(fabric) };
    if (color) filter['colors.name'] = { $in: csv(color) };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }
    if (flag === 'best') filter.isBestSeller = true;
    if (flag === 'new') filter.isNewArrival = true;
    if (search?.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim().slice(0, 80)), 'i');
      filter.$or = [{ name: pattern }, { sku: pattern }, { composition: pattern }, { fabricType: pattern }, { tags: pattern }];
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).select(LIST_FIELDS).populate('category', 'name slug').sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).lean(),
    ]);

    return ApiResponse.ok(res, products.map(withStock), 'Products fetched', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/products/filters: values that can populate the filter sidebar. */
export async function getProductFilters(_req, res, next) {
  try {
    const active = { status: 'active' };
    const [fabricTypes, colorRows, cheapest, priciest] = await Promise.all([
      Product.distinct('fabricType', active),
      Product.find(active).select('colors').lean(),
      Product.findOne(active).sort({ price: 1 }).select('price').lean(),
      Product.findOne(active).sort({ price: -1 }).select('price').lean(),
    ]);
    return ApiResponse.ok(res, {
      fabricTypes: fabricTypes.sort(),
      colors: [...new Map(colorRows.flatMap((p) => p.colors).map((c) => [c.name, c])).values()].sort((a, b) => a.name.localeCompare(b.name)),
      price: { min: Math.floor(cheapest?.price ?? 0), max: Math.ceil(priciest?.price ?? 0) },
    });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/products/:slug: full product with up to 4 related products. */
export async function getProductBySlug(req, res, next) {
  try {
    const product = await Product.findOne({ slug: req.params.slug.toLowerCase(), status: 'active' }).populate('category', 'name slug').lean();
    if (!product) throw ApiError.notFound('This fabric is no longer available');

    const related = await Product.find({ status: 'active', category: product.category._id, _id: { $ne: product._id } })
      .select(LIST_FIELDS).populate('category', 'name slug').sort({ salesCount: -1 }).limit(4).lean();

    return ApiResponse.ok(res, { ...withStock(product), related: related.map(withStock) }, 'Product fetched');
  } catch (error) {
    return next(error);
  }
}
