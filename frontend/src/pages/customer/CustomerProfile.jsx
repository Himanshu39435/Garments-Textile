import { useState } from 'react';
import { Alert, Button, Form, Input, message } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useAuth from '@/hooks/useAuth';
import { changePassword } from '@/services/api/authApi';
import { updateProfile } from '@/services/api/customerApi';
import { confirmRules, gstinRules, nameRules, passwordRules, phoneRules } from '@/utils/validateForm';

function useSubmit() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const run = async (task) => {
    setError('');
    setSubmitting(true);
    try { await task(); } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  };
  return { error, submitting, run };
}

export default function CustomerProfile() {
  usePageTitle('My profile');
  const { user, updateUser, startSession } = useAuth();
  const profile = useSubmit();
  const security = useSubmit();
  const [passwordForm] = Form.useForm();

  const saveProfile = (values) => profile.run(async () => {
    const response = await updateProfile({ ...values, gstin: values.gstin?.trim() ?? '', companyName: values.companyName ?? '', businessType: values.businessType ?? '' });
    updateUser(response.data.user);
    message.success('Profile saved');
  });

  const savePassword = ({ currentPassword, newPassword }) => security.run(async () => {
    const response = await changePassword(currentPassword, newPassword);
    startSession(response.data); // the old token is now invalid, so keep the fresh one
    passwordForm.resetFields();
    message.success('Password changed');
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">My profile</h1>
      <p className="mt-2 text-ink/70">Your details appear on quotations and GST invoices.</p>

      <section className="surface p-6 md:p-8 mt-8" aria-labelledby="details">
        <h2 id="details" className="text-2xl mb-4">Account and business details</h2>
        {profile.error && <Alert type="error" showIcon message={profile.error} className="!mb-4" />}
        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={saveProfile}
          initialValues={{ name: user.name, phone: user.phone, companyName: user.business?.companyName, gstin: user.business?.gstin, businessType: user.business?.businessType }}
        >
          <Form.Item label="Email"><Input value={user.email} disabled /></Form.Item>
          <div className="grid md:grid-cols-2 gap-x-4">
            <Form.Item label="Full name" name="name" rules={nameRules}><Input autoComplete="name" /></Form.Item>
            <Form.Item label="Mobile number" name="phone" rules={phoneRules}><Input autoComplete="tel" inputMode="tel" /></Form.Item>
            <Form.Item label="Company" name="companyName"><Input autoComplete="organization" /></Form.Item>
            <Form.Item label="Business type" name="businessType"><Input placeholder="Manufacturer, boutique, reseller" /></Form.Item>
          </div>
          <Form.Item label="GSTIN" name="gstin" rules={gstinRules}><Input maxLength={15} style={{ textTransform: 'uppercase' }} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={profile.submitting}>Save changes</Button>
        </Form>
      </section>

      <section className="surface p-6 md:p-8 mt-8" aria-labelledby="security">
        <h2 id="security" className="text-2xl mb-4">Change password</h2>
        {security.error && <Alert type="error" showIcon message={security.error} className="!mb-4" />}
        <Form form={passwordForm} layout="vertical" requiredMark={false} onFinish={savePassword}>
          <Form.Item label="Current password" name="currentPassword" rules={[{ required: true, message: 'Enter your current password' }]}><Input.Password autoComplete="current-password" /></Form.Item>
          <Form.Item label="New password" name="newPassword" rules={passwordRules}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item label="Confirm new password" name="confirmPassword" dependencies={['newPassword']} rules={confirmRules('newPassword')}><Input.Password autoComplete="new-password" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={security.submitting}>Change password</Button>
        </Form>
      </section>
    </div>
  );
}
