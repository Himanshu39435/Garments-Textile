import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import StaffLayout from '@/components/layout/StaffLayout';

const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'));
const StaffStockOverview = lazy(() => import('@/pages/staff/StaffStockOverview'));
// Orders, quotations and customers are the same pages the admin uses. They read the role and stay inside /staff (see usePanelPaths.js).
const AdminOrderManagement = lazy(() => import('@/pages/admin/AdminOrderManagement'));
const AdminOrderDetails = lazy(() => import('@/pages/admin/AdminOrderDetails'));
const AdminQuotationManagement = lazy(() => import('@/pages/admin/AdminQuotationManagement'));
const AdminQuotationDetails = lazy(() => import('@/pages/admin/AdminQuotationDetails'));
const AdminCustomerManagement = lazy(() => import('@/pages/admin/AdminCustomerManagement'));
const AdminCustomerDetails = lazy(() => import('@/pages/admin/AdminCustomerDetails'));
const NotFoundPage = lazy(() => import('@/pages/home/NotFoundPage'));

/**
 * Staff area, mounted at /staff/* behind ProtectedRoute roles={['staff']} (see AppRoutes.jsx).
 * The browser check is only for convenience: the API checks the role again on every request.
 */
export default function StaffRoutes() {
  return (
    <Routes>
      <Route element={<StaffLayout />}>
        <Route index element={<StaffDashboard />} />
        <Route path="orders" element={<AdminOrderManagement />} />
        <Route path="orders/:id" element={<AdminOrderDetails />} />
        <Route path="quotations" element={<AdminQuotationManagement />} />
        <Route path="quotations/:id" element={<AdminQuotationDetails />} />
        <Route path="stock" element={<StaffStockOverview />} />
        <Route path="customers" element={<AdminCustomerManagement />} />
        <Route path="customers/:id" element={<AdminCustomerDetails />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
