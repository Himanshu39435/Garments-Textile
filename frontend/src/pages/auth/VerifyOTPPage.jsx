import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Input, message } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useAuth from '@/hooks/useAuth';
import useCountdown from '@/hooks/useCountdown';
import AuthLayout from '@/components/layout/AuthLayout';
import { resendOtp, verifyOtp } from '@/services/api/authApi';

/** Reached from registration or from a login attempt on an unverified account. Email arrives via router state. */
export default function VerifyOTPPage() {
  usePageTitle('Verify email');
  const { startSession } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, startCooldown] = useCountdown(60);

  if (!email) return <Navigate to="/register" replace />;

  const submit = async (value = code) => {
    if (value.length !== 6) { setError('Enter the 6-digit code'); return; }
    setError('');
    setSubmitting(true);
    try {
      const response = await verifyOtp(email, value);
      startSession(response.data);
      message.success('Email verified');
      navigate(state?.from?.pathname ?? '/', { replace: true });
    } catch (e) {
      setError(e.message);
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    try {
      await resendOtp(email);
      message.success('A new code is on its way');
      startCooldown(60);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={<>We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.</>}
      footer={<>Wrong address? <Link to="/register">Start again</Link></>}
    >
      {error && <Alert type="error" showIcon message={error} className="!mb-4" />}
      <Input.OTP length={6} value={code} onChange={setCode} onInput={(digits) => digits.join('').length === 6 && submit(digits.join(''))} size="large" aria-label="Verification code" />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="primary" onClick={() => submit()} loading={submitting}>Verify email</Button>
        <Button type="link" onClick={resend} disabled={cooldown > 0} className="!px-0">{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</Button>
      </div>
    </AuthLayout>
  );
}
