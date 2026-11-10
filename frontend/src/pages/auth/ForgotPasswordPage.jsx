import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Input } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useCountdown from '@/hooks/useCountdown';
import AuthLayout from '@/components/layout/AuthLayout';
import { forgotPassword, resetPassword } from '@/services/api/authApi';
import { confirmRules, emailRules, passwordRules } from '@/utils/validateForm';

/** Two steps on one page: request a code, then enter it with a new password. */
export default function ForgotPasswordPage() {
  usePageTitle('Reset password');
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, startCooldown] = useCountdown(0);

  const run = async (task) => {
    setError('');
    setSubmitting(true);
    try { await task(); } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  };

  const requestCode = (values) => run(async () => {
    const address = (values?.email ?? email).trim();
    await forgotPassword(address);
    setEmail(address);
    setStep('reset');
    startCooldown(60);
  });

  const submitReset = ({ otp, newPassword }) => run(async () => {
    await resetPassword(email, otp, newPassword);
    navigate('/login', { replace: true, state: { notice: 'Password updated. Sign in with your new password.' } });
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={step === 'email' ? 'Enter your email and we will send a 6-digit code.' : <>If an account exists for <strong>{email}</strong>, a code is on its way. It expires in 10 minutes.</>}
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {error && <Alert type="error" showIcon message={error} className="!mb-4" />}
      {step === 'email' ? (
        <Form layout="vertical" onFinish={requestCode} requiredMark={false}>
          <Form.Item label="Email" name="email" rules={emailRules}><Input type="email" autoComplete="email" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>Send code</Button>
        </Form>
      ) : (
        <Form layout="vertical" onFinish={submitReset} requiredMark={false}>
          <Form.Item label="6-digit code" name="otp" rules={[{ required: true, len: 6, message: 'Enter the 6-digit code' }]}><Input.OTP length={6} size="large" /></Form.Item>
          <Form.Item label="New password" name="newPassword" rules={passwordRules}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item label="Confirm new password" name="confirmPassword" dependencies={['newPassword']} rules={confirmRules('newPassword')}><Input.Password autoComplete="new-password" /></Form.Item>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="primary" htmlType="submit" loading={submitting}>Update password</Button>
            <Button type="link" disabled={cooldown > 0 || submitting} onClick={() => requestCode()} className="!px-0">{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</Button>
          </div>
        </Form>
      )}
    </AuthLayout>
  );
}
