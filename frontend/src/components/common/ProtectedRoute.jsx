import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { roleHome } from '@/utils/constants';

/**
 * Wrap pages that need a signed-in user. Pass `roles={['admin']}` to restrict by role: anyone else is sent to their own dashboard.
 * This is a convenience for the UI only. The API enforces access independently.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}
