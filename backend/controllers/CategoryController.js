import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

/** GET /api/categories: active categories with the number of active products in each. */
export async function listCategories(_req, res, next) {
  try {
    const [categories, counts] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      Product.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    const countById = new Map(counts.map((c) => [String(c._id), c.count]));
    return ApiResponse.ok(res, categories.map((c) => ({ ...c, productCount: countById.get(String(c._id)) ?? 0 })));
  } catch (error) {
    return next(error);
  }
}

/** GET /api/categories/:slug */
export async function getCategoryBySlug(req, res, next) {
  try {
    const category = await Category.findOne({ slug: req.params.slug.toLowerCase(), isActive: true }).lean();
    if (!category) throw ApiError.notFound('Category not found');
    return ApiResponse.ok(res, category);
  } catch (error) {
    return next(error);
  }
}
