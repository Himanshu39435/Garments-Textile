import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProductManagement = lazy(() => import('@/pages/admin/AdminProductManagement'));
const AdminAddProduct = lazy(() => import('@/pages/admin/AdminAddProduct'));
const AdminEditProduct = lazy(() => import('@/pages/admin/AdminEditProduct'));
const AdminCategoryManagement = lazy(() => import('@/pages/admin/AdminCategoryManagement'));
const AdminOrderManagement = lazy(() => import('@/pages/admin/AdminOrderManagement'));
const AdminOrderDetails = lazy(() => import('@/pages/admin/AdminOrderDetails'));
const AdminQuotationManagement = lazy(() => import('@/pages/admin/AdminQuotationManagement'));
const AdminQuotationDetails = lazy(() => import('@/pages/admin/AdminQuotationDetails'));
const AdminCustomerManagement = lazy(() => import('@/pages/admin/AdminCustomerManagement'));
const AdminCustomerDetails = lazy(() => import('@/pages/admin/AdminCustomerDetails'));
const AdminStaffManagement = lazy(() => import('@/pages/admin/AdminStaffManagement'));
const AdminPaymentManagement = lazy(() => import('@/pages/admin/AdminPaymentManagement'));
const AdminCouponManagement = lazy(() => import('@/pages/admin/AdminCouponManagement'));
const AdminSalesReports = lazy(() => import('@/pages/admin/AdminSalesReports'));
const AdminWebsiteSettings = lazy(() => import('@/pages/admin/AdminWebsiteSettings'));
const NotFoundPage = lazy(() => import('@/pages/home/NotFoundPage'));

/**
 * Admin area, mounted at /admin/* behind ProtectedRoute roles={['admin']} (see AppRoutes.jsx).
 * The browser check is only for convenience: every /api/admin route is protected again on the server.
 * Admin-only payment, coupon, report and website settings pages live here.
 */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProductManagement />} />
        <Route path="products/new" element={<AdminAddProduct />} />
        <Route path="products/:id/edit" element={<AdminEditProduct />} />
        <Route path="categories" element={<AdminCategoryManagement />} />
        <Route path="orders" element={<AdminOrderManagement />} />
        <Route path="orders/:id" element={<AdminOrderDetails />} />
        <Route path="quotations" element={<AdminQuotationManagement />} />
        <Route path="quotations/:id" element={<AdminQuotationDetails />} />
        <Route path="customers" element={<AdminCustomerManagement />} />
        <Route path="customers/:id" element={<AdminCustomerDetails />} />
        <Route path="staff" element={<AdminStaffManagement />} />
        <Route path="payments" element={<AdminPaymentManagement />} />
        <Route path="coupons" element={<AdminCouponManagement />} />
        <Route path="reports" element={<AdminSalesReports />} />
        <Route path="settings" element={<AdminWebsiteSettings />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
