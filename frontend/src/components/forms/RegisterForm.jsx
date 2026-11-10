import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { register } from '@/services/api/authApi';
import { confirmRules, emailRules, gstinRules, nameRules, passwordRules, phoneRules } from '@/utils/validateForm';

/** Account + business details. Calls `onRegistered(email)` after the verification code has been sent. */
export default function RegisterForm({ onRegistered }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async ({ confirmPassword: _ignored, ...values }) => {
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...values, email: values.email.trim(), gstin: values.gstin?.trim().toUpperCase() || undefined, companyName: values.companyName?.trim() || undefined };
      const response = await register(payload);
      onRegistered(response.data.email);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form layout="vertical" onFinish={handleFinish} requiredMark={false} autoComplete="on">
      {error && <Alert type="error" showIcon message={error} className="!mb-4" />}
      <div className="grid md:grid-cols-2 gap-x-4">
        <Form.Item label="Full name" name="name" rules={nameRules}><Input autoComplete="name" /></Form.Item>
        <Form.Item label="Mobile number" name="phone" rules={phoneRules}><Input autoComplete="tel" inputMode="tel" placeholder="98765 43210" /></Form.Item>
      </div>
      <Form.Item label="Email" name="email" rules={emailRules}><Input type="email" autoComplete="email" placeholder="name@company.com" /></Form.Item>
      <div className="grid md:grid-cols-2 gap-x-4">
        <Form.Item label="Company (optional)" name="companyName"><Input autoComplete="organization" /></Form.Item>
        <Form.Item label="GSTIN (optional)" name="gstin" rules={gstinRules} extra="Printed on your tax invoices"><Input maxLength={15} placeholder="08ABCDE1234F1Z5" style={{ textTransform: 'uppercase' }} /></Form.Item>
      </div>
      <Form.Item label="Password" name="password" rules={passwordRules} extra="At least 8 characters with a letter and a number"><Input.Password autoComplete="new-password" /></Form.Item>
      <Form.Item label="Confirm password" name="confirmPassword" dependencies={['password']} rules={confirmRules('password')}><Input.Password autoComplete="new-password" /></Form.Item>
      <Button type="primary" htmlType="submit" loading={submitting} block>Create account</Button>
    </Form>
  );
}
