import { Link, Navigate, useNavigate } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import useAuth from '@/hooks/useAuth';
import AuthLayout from '@/components/layout/AuthLayout';
import RegisterForm from '@/components/forms/RegisterForm';

export default function RegisterPage() {
  usePageTitle('Create account');
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="We will email a 6-digit code to confirm your address."
      footer={<>Already registered? <Link to="/login">Sign in</Link></>}
    >
      <RegisterForm onRegistered={(email) => navigate('/verify-otp', { state: { email } })} />
    </AuthLayout>
  );
}
