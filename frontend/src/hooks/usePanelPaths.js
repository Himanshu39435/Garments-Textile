import useAuth from '@/hooks/useAuth';

/**
 * Admin and staff share the order, quotation and customer pages. This returns the URL prefix of the panel
 * the signed-in person is in, so links stay inside it: '/staff' for staff, '/admin' for everyone else.
 */
export default function usePanelPaths() {
  const { user } = useAuth();
  const base = user?.role === 'staff' ? '/staff' : '/admin';
  return { base, isAdmin: user?.role === 'admin' };
}
