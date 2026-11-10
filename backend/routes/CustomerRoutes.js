import { Router } from 'express';
import { addToWishlist, getDashboardSummary, getWishlist, removeFromWishlist, updateProfile } from '../controllers/CustomerController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { requireCustomer } from '../middleware/RoleMiddleware.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateProfileUpdate } from '../validators/CustomerValidator.js';

const router = Router();
router.use(protect);
router.get('/dashboard', requireCustomer, getDashboardSummary); // each role has its own dashboard API
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);
router.put('/profile', validateBody(validateProfileUpdate), updateProfile);

export default router;
