import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, message } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useAuth from '@/hooks/useAuth';
import AuthLayout from '@/components/layout/AuthLayout';
import LoginForm from '@/components/forms/LoginForm';
import { roleHome } from '@/utils/constants';

export default function LoginPage() {
  usePageTitle('Sign in');
  const { user, startSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const homeFor = (u) => roleHome(u?.role);
  const destination = location.state?.from?.pathname ?? homeFor(user);
  const notice = location.state?.notice;

  if (user) return <Navigate to={destination} replace />;

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your orders, quotations and saved fabrics."
      footer={<>New to NARANG TEXTILE? <Link to="/register">Create an account</Link></>}
    >
      {notice && <Alert type="success" showIcon message={notice} className="!mb-4" />}
      <LoginForm
        onSuccess={(session) => { startSession(session); message.success('Signed in'); navigate(location.state?.from?.pathname ?? homeFor(session.user), { replace: true }); }}
        onNeedsVerification={(email) => navigate('/verify-otp', { state: { email, from: location.state?.from } })}
      />
      <p className="mt-4 mb-0"><Link to="/forgot-password">Forgot your password?</Link></p>
    </AuthLayout>
  );
}
