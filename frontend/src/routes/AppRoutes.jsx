import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import CustomerRoutes from '@/routes/CustomerRoutes';
import AdminRoutes from '@/routes/AdminRoutes';
import StaffRoutes from '@/routes/StaffRoutes';

const HomePage = lazy(() => import('@/pages/home/HomePage'));
const AboutPage = lazy(() => import('@/pages/home/AboutPage'));
const ContactPage = lazy(() => import('@/pages/home/ContactPage'));
const ProductListingPage = lazy(() => import('@/pages/products/ProductListingPage'));
const ProductDetailsPage = lazy(() => import('@/pages/products/ProductDetailsPage'));
const CategoryPage = lazy(() => import('@/pages/products/CategoryPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyOTPPage = lazy(() => import('@/pages/auth/VerifyOTPPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const CartPage = lazy(() => import('@/pages/cart/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/cart/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/cart/OrderSuccessPage'));
const CustomerNewQuotation = lazy(() => import('@/pages/customer/CustomerNewQuotation'));
const QuoteCheckoutPage = lazy(() => import('@/pages/cart/QuoteCheckoutPage'));
const NotFoundPage = lazy(() => import('@/pages/home/NotFoundPage'));
const DesignSystemPage = lazy(() => import('@/pages/dev/DesignSystemPage'));

/**
 * Root route table. Pages are lazy-loaded. Catalogue routes are live (Phase 3). Auth routes are live (Phase 4). Cart and checkout are live (Phase 5).
 * Three dashboards, one per role, each behind its own role check: customer /account (CustomerRoutes.jsx), staff /staff (StaffRoutes.jsx), admin /admin (AdminRoutes.jsx). Staff and admin have their own layouts, outside MainLayout.
 * Links to routes that do not exist yet (e.g. /account/wishlist) show NotFoundPage until their phase lands.
 */
export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <Routes>
        <Route path="/design-system" element={<DesignSystemPage />} />
        <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AdminRoutes /></ProtectedRoute>} />
        <Route path="/staff/*" element={<ProtectedRoute roles={['staff']}><StaffRoutes /></ProtectedRoute>} />
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductListingPage />} />
          <Route path="products/:slug" element={<ProductDetailsPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
          <Route path="quote" element={<ProtectedRoute><CustomerNewQuotation /></ProtectedRoute>} />
          <Route path="quotation-checkout/:id" element={<ProtectedRoute><QuoteCheckoutPage /></ProtectedRoute>} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOTPPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="account/*" element={<ProtectedRoute roles={['customer']}><CustomerRoutes /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}
