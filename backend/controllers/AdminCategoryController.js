import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { slugify, uniqueSlug } from '../utils/Slugify.js';
import { deleteImage } from '../services/CloudinaryService.js';

const ID = /^[a-f\d]{24}$/i;
const clean = (b) => ({
  name: b.name.trim(), description: (b.description ?? '').trim(), sortOrder: b.sortOrder ?? 0, isActive: b.isActive ?? true,
  image: b.image ? { url: b.image.url, publicId: b.image.publicId } : undefined,
});

/** GET /api/admin/categories: including hidden ones, with product counts. */
export async function listCategories(_req, res, next) {
  try {
    const [categories, products] = await Promise.all([Category.find({}).sort({ sortOrder: 1, name: 1 }).lean(), Product.find({}).select('category status').lean()]);
    const counts = new Map();
    for (const p of products) counts.set(String(p.category), (counts.get(String(p.category)) ?? 0) + 1);
    return ApiResponse.ok(res, categories.map((c) => ({ ...c, productCount: counts.get(String(c._id)) ?? 0 })));
  } catch (error) { return next(error); }
}

export async function createCategory(req, res, next) {
  try {
    const data = clean(req.body);
    data.slug = req.body.slug || await uniqueSlug(slugify(data.name), (s) => Category.exists({ slug: s }));
    if (await Category.exists({ $or: [{ name: data.name }, { slug: data.slug }] })) throw ApiError.conflict('A category with that name or slug already exists');
    return ApiResponse.created(res, await Category.create(data), 'Category created');
  } catch (error) { return next(error); }
}

export async function updateCategory(req, res, next) {
  try {
    const category = ID.test(req.params.id) ? await Category.findById(req.params.id) : null;
    if (!category) throw ApiError.notFound('Category not found');
    const previous = category.image?.publicId;
    const data = clean(req.body);
    const nextSlug = req.body.slug || category.slug;
    const clash = await Category.findOne({ _id: { $ne: category._id }, $or: [{ name: data.name }, { slug: nextSlug }] }).select('name').lean();
    if (clash) throw ApiError.conflict('Another category already uses that name or slug');
    category.set({ ...data, slug: nextSlug });
    if (!data.image) category.image = undefined;
    await category.save();
    if (previous && previous !== category.image?.publicId) await deleteImage(previous);
    return ApiResponse.ok(res, category, 'Category updated');
  } catch (error) { return next(error); }
}

/** DELETE /api/admin/categories/:id. Refused while products still use it. */
export async function deleteCategory(req, res, next) {
  try {
    const category = ID.test(req.params.id) ? await Category.findById(req.params.id) : null;
    if (!category) throw ApiError.notFound('Category not found');
    const inUse = await Product.countDocuments({ category: category._id });
    if (inUse > 0) throw ApiError.conflict(`${inUse} ${inUse === 1 ? 'product uses' : 'products use'} this category. Move or delete ${inUse === 1 ? 'it' : 'them'} first, or hide the category instead.`);
    await category.deleteOne();
    await deleteImage(category.image?.publicId);
    return ApiResponse.ok(res, null, 'Category deleted');
  } catch (error) { return next(error); }
}
