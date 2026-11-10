import { Router } from 'express';
import { addItem, clearCart, getCart, removeItem, updateItem } from '../controllers/CartController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateAddToCart, validateUpdateCartItem } from '../validators/CartValidator.js';

const router = Router();
router.use(protect);
router.get('/', getCart);
router.post('/items', validateBody(validateAddToCart), addItem);
router.put('/items/:productId', validateBody(validateUpdateCartItem), updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

export default router;
