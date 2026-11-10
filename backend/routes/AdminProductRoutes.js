import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/AdminProductController.js';
import { requireAdmin } from '../middleware/RoleMiddleware.js';
import { validateBody, validateQuery } from '../middleware/ValidationMiddleware.js';
import { validateAdminProductQuery, validateProductInput } from '../validators/ProductValidator.js';

const router = Router(); // mounted under /api/admin/products, for admin and staff; staff can only read
router.get('/', validateQuery(validateAdminProductQuery), listProducts);
router.post('/', requireAdmin, validateBody(validateProductInput), createProduct);
router.get('/:id', getProduct);
router.put('/:id', requireAdmin, validateBody(validateProductInput), updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);
export default router;
