import { Router } from 'express';
import { getStaffDashboard, getStaffSession } from '../controllers/StaffController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { requireStaff } from '../middleware/RoleMiddleware.js';

const router = Router(); // mounted under /api/staff. Staff only: admins use /api/admin/dashboard
router.use(protect, requireStaff);
router.get('/session', getStaffSession);
router.get('/dashboard', getStaffDashboard);
export default router;
