import { Router } from 'express';
import { createStaff, listStaff, resetStaffPassword, setStaffStatus, updateStaff } from '../controllers/AdminStaffController.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateStaffCreate, validateStaffPassword, validateStaffStatus, validateStaffUpdate } from '../validators/StaffValidator.js';

const router = Router(); // mounted under /api/admin/staff, admin only (guard is in AdminRoutes.js)
router.get('/', listStaff);
router.post('/', validateBody(validateStaffCreate), createStaff);
router.put('/:id', validateBody(validateStaffUpdate), updateStaff);
router.put('/:id/status', validateBody(validateStaffStatus), setStaffStatus);
router.put('/:id/password', validateBody(validateStaffPassword), resetStaffPassword);
export default router;
