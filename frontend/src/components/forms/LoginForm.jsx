import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { login } from '@/services/api/authApi';
import { emailRules } from '@/utils/validateForm';

/**
 * Email + password form. Calls `onSuccess({ token, user })` or, when the email is not yet verified,
 * `onNeedsVerification(email)`.
 */
export default function LoginForm({ onSuccess, onNeedsVerification }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async ({ email, password }) => {
    setError('');
    setSubmitting(true);
    try {
      const response = await login(email.trim(), password);
      onSuccess(response.data);
    } catch (e) {
      if (e.code === 'EMAIL_NOT_VERIFIED') onNeedsVerification(email.trim().toLowerCase());
      else setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form layout="vertical" onFinish={handleFinish} requiredMark={false} autoComplete="on">
      {error && <Alert type="error" showIcon message={error} className="!mb-4" />}
      <Form.Item label="Email" name="email" rules={emailRules}><Input type="email" autoComplete="email" placeholder="name@company.com" /></Form.Item>
      <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Enter your password' }]}><Input.Password autoComplete="current-password" /></Form.Item>
      <Button type="primary" htmlType="submit" loading={submitting} block>Sign in</Button>
    </Form>
  );
}
