import { Router } from 'express';
import { getProductBySlug, getProductFilters, listProducts } from '../controllers/ProductController.js';
import { validateQuery } from '../middleware/ValidationMiddleware.js';
import { validateProductListQuery } from '../validators/ProductValidator.js';

const router = Router();

router.get('/', validateQuery(validateProductListQuery), listProducts);
router.get('/filters', getProductFilters); // must stay above /:slug
router.get('/:slug', getProductBySlug);

export default router;
