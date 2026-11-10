import { Router } from 'express';
import { getCategoryBySlug, listCategories } from '../controllers/CategoryController.js';

const router = Router();
router.get('/', listCategories);
router.get('/:slug', getCategoryBySlug);

export default router;
