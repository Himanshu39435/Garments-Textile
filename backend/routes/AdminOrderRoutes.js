import { Router } from 'express';
import { downloadInvoice, getOrder, listOrders, markPaid, markRefunded, updateShipment, updateStatus } from '../controllers/AdminOrderController.js';
import { requireAdmin } from '../middleware/RoleMiddleware.js';
import { validateBody, validateQuery } from '../middleware/ValidationMiddleware.js';
import { validateAdminOrderQuery, validateReference, validateShipment, validateStatusChange } from '../validators/OrderValidator.js';

const router = Router(); // mounted under /api/admin/orders for admin and staff; money actions below are admin only
router.get('/', validateQuery(validateAdminOrderQuery), listOrders);
router.get('/:id', getOrder);
router.get('/:id/invoice', downloadInvoice);
router.put('/:id/status', validateBody(validateStatusChange), updateStatus);
router.put('/:id/shipment', validateBody(validateShipment), updateShipment);
router.post('/:id/mark-paid', requireAdmin, validateBody(validateReference), markPaid);
router.post('/:id/mark-refunded', requireAdmin, validateBody(validateReference), markRefunded);
export default router;
