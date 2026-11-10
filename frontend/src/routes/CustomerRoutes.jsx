import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import CustomerLayout from '@/components/layout/CustomerLayout';

const CustomerDashboard = lazy(() => import('@/pages/customer/CustomerDashboard'));
const CustomerOrders = lazy(() => import('@/pages/customer/CustomerOrders'));
const CustomerOrderDetails = lazy(() => import('@/pages/customer/CustomerOrderDetails'));
const CustomerQuotations = lazy(() => import('@/pages/customer/CustomerQuotations'));
const CustomerQuotationDetails = lazy(() => import('@/pages/customer/CustomerQuotationDetails'));
const CustomerAddresses = lazy(() => import('@/pages/customer/CustomerAddresses'));
const CustomerWishlist = lazy(() => import('@/pages/customer/CustomerWishlist'));
const CustomerProfile = lazy(() => import('@/pages/customer/CustomerProfile'));
const NotFoundPage = lazy(() => import('@/pages/home/NotFoundPage'));

/**
 * Customer area, mounted at /account/* behind ProtectedRoute (see AppRoutes.jsx).
 */
export default function CustomerRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<CustomerDashboard />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="orders/:id" element={<CustomerOrderDetails />} />
        <Route path="quotations" element={<CustomerQuotations />} />
        <Route path="quotations/:id" element={<CustomerQuotationDetails />} />
        <Route path="addresses" element={<CustomerAddresses />} />
        <Route path="wishlist" element={<CustomerWishlist />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
