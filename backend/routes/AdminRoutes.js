import { Router } from 'express';
import { getAdminSession, getDashboard, uploadImage } from '../controllers/AdminController.js';
import { uploadSingleImage } from '../middleware/UploadMiddleware.js';
import adminCategoryRoutes from './AdminCategoryRoutes.js';
import adminCustomerRoutes from './AdminCustomerRoutes.js';
import adminOrderRoutes from './AdminOrderRoutes.js';
import adminProductRoutes from './AdminProductRoutes.js';
import adminQuotationRoutes from './AdminQuotationRoutes.js';
import adminStaffRoutes from './AdminStaffRoutes.js';
import adminCouponRoutes from './AdminCouponRoutes.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { requireAdmin, requireStaffOrAdmin } from '../middleware/RoleMiddleware.js';
import { getSalesReport, getWebsiteSettings, listAdminPayments, saveWebsiteSettings } from '../controllers/AdminContentController.js';
import { validateBody, validateQuery } from '../middleware/ValidationMiddleware.js';
import { validateAdminPaymentQuery, validateReportQuery, validateWebsiteSettings } from '../validators/AdminContentValidator.js';

/**
 * Back-office API, mounted at /api/admin. Access is decided here, per feature, and nothing is open by default:
 *   admin only      session, dashboard, image upload, categories, staff accounts
 *   admin + staff   products, orders, quotations, customers (the sub-routers lock their write actions to admin where needed)
 * Staff get their own dashboard at /api/staff (see StaffRoutes.js).
 */
const router = Router();
router.use(protect);
router.get('/session', requireAdmin, getAdminSession);
router.get('/dashboard', requireAdmin, getDashboard);
router.get('/payments', requireAdmin, validateQuery(validateAdminPaymentQuery), listAdminPayments);
router.get('/reports', requireAdmin, validateQuery(validateReportQuery), getSalesReport);
router.get('/settings', requireAdmin, getWebsiteSettings);
router.put('/settings', requireAdmin, validateBody(validateWebsiteSettings), saveWebsiteSettings);
router.post('/uploads/image', requireAdmin, uploadSingleImage, uploadImage);
router.use('/coupons', requireAdmin, adminCouponRoutes);
router.use('/categories', requireAdmin, adminCategoryRoutes);
router.use('/staff', requireAdmin, adminStaffRoutes);
router.use('/products', requireStaffOrAdmin, adminProductRoutes); // staff: read only
router.use('/orders', requireStaffOrAdmin, adminOrderRoutes); // staff: no payment confirmation, refunds or cancellations
router.use('/quotations', requireStaffOrAdmin, adminQuotationRoutes);
router.use('/customers', requireStaffOrAdmin, adminCustomerRoutes); // staff: read only

export default router;
