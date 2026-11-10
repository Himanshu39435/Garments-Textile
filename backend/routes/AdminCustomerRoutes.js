import { Router } from 'express';
import { getCustomer, listCustomers, setCustomerStatus } from '../controllers/AdminCustomerController.js';
import { requireAdmin } from '../middleware/RoleMiddleware.js';
import { validateBody, validateQuery } from '../middleware/ValidationMiddleware.js';
import { validateAdminCustomerQuery, validateCustomerStatus } from '../validators/CustomerValidator.js';

const router = Router(); // mounted under /api/admin/customers for admin and staff; only admin may deactivate
router.get('/', validateQuery(validateAdminCustomerQuery), listCustomers);
router.get('/:id', getCustomer);
router.put('/:id/status', requireAdmin, validateBody(validateCustomerStatus), setCustomerStatus);
export default router;
