import { Router } from 'express';
import { cancelMyOrder, createOrder, downloadInvoice, getMyOrder, listMyOrders } from '../controllers/OrderController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateCheckout } from '../validators/OrderValidator.js';

const router = Router();
router.use(protect);
router.post('/', validateBody(validateCheckout), createOrder);
router.get('/', listMyOrders);
router.get('/:id', getMyOrder);
router.get('/:id/invoice', downloadInvoice);
router.post('/:id/cancel', cancelMyOrder);

export default router;
