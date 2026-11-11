import { Router } from 'express';
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from '../controllers/AdminContentController.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateCouponInput } from '../validators/AdminContentValidator.js';

const router = Router();
router.get('/', listCoupons);
router.post('/', validateBody(validateCouponInput), createCoupon);
router.put('/:id', validateBody(validateCouponInput), updateCoupon);
router.delete('/:id', deleteCoupon);
export default router;
