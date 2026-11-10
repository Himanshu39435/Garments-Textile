import { Router } from 'express';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/AdminCategoryController.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateCategoryInput } from '../validators/CategoryValidator.js';

const router = Router(); // mounted under /api/admin/categories
router.get('/', listCategories);
router.post('/', validateBody(validateCategoryInput), createCategory);
router.put('/:id', validateBody(validateCategoryInput), updateCategory);
router.delete('/:id', deleteCategory);
export default router;
