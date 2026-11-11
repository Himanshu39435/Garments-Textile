import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, message, Switch } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getWebsiteSettings, saveWebsiteSettings } from '@/services/api/adminApi';

const numberStyle = { width: '100%' };
const Section = ({ title, children }) => <section className="surface p-5 md:p-6"><h2 className="text-xl mb-4">{title}</h2>{children}</section>;

export default function AdminWebsiteSettings() {
  usePageTitle('Website settings');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getWebsiteSettings()
      .then((response) => form.setFieldsValue(response.data))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [form]);
  useEffect(() => { load(); }, [load]);

  const submit = async (values) => {
    setSaving(true);
    setError('');
    try {
      await saveWebsiteSettings({ ...values, banners: values.banners ?? [] });
      message.success('Website settings saved');
    } catch (reason) {
      setError(reason.message);
      const fieldErrors = (reason.details ?? []).filter((item) => item.field && !item.field.includes('.')).map((item) => ({ name: item.field, errors: [item.message] }));
      if (fieldErrors.length) form.setFields(fieldErrors);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl">Website settings</h1><Button type="primary" onClick={() => form.submit()} loading={saving}>Save settings</Button></div>
      {error && <ErrorMessage title="Could not save settings" message={error} onRetry={load} />}
      <Alert type="info" showIcon message="Admin settings are saved for Narang Textile. Customer storefront and checkout behavior are not changed." />
      <Form form={form} layout="vertical" disabled={loading} onFinish={submit} onValuesChange={() => error && setError('')} className="space-y-5">
        <Section title="Brand">
          <Form.Item label="Brand name" name="brandName" rules={[{ required: true, whitespace: true, message: 'Enter a brand name' }]}><Input maxLength={120} /></Form.Item>
          <Form.Item label="Logo URL" name="logoUrl" rules={[{ type: 'url', warningOnly: true, message: 'Enter a full URL starting with http or https' }]}><Input placeholder="https://..." /></Form.Item>
        </Section>
        <Section title="Contact and social">
          <div className="grid md:grid-cols-2 gap-x-4">
            <Form.Item label="Email" name="email"><Input type="email" maxLength={254} /></Form.Item>
            <Form.Item label="Phone" name="phone"><Input maxLength={30} /></Form.Item>
            <Form.Item label="Address" name="address" className="md:col-span-2"><Input maxLength={500} /></Form.Item>
            <Form.Item label="WhatsApp number" name="whatsapp"><Input maxLength={30} /></Form.Item>
            <Form.Item label="Instagram URL" name="instagramUrl"><Input placeholder="https://..." maxLength={500} /></Form.Item>
            <Form.Item label="Facebook URL" name="facebookUrl"><Input placeholder="https://..." maxLength={500} /></Form.Item>
            <Form.Item label="YouTube URL" name="youtubeUrl"><Input placeholder="https://..." maxLength={500} /></Form.Item>
          </div>
        </Section>
        <Section title="Shipping">
          <div className="grid md:grid-cols-2 gap-x-4">
            <Form.Item label="Shipping charge ₹" name="shippingCharge"><InputNumber min={0} precision={2} style={numberStyle} /></Form.Item>
            <Form.Item label="Free shipping above ₹" name="freeShippingAbove"><InputNumber min={0} precision={2} style={numberStyle} /></Form.Item>
          </div>
        </Section>
        <Section title="GST and invoice">
          <p className="text-sm text-ink/60">Enter the verified business details used by Narang Textile.</p>
          <div className="grid md:grid-cols-2 gap-x-4">
            <Form.Item label="Legal business name" name="legalBusinessName"><Input maxLength={160} /></Form.Item>
            <Form.Item label="GSTIN" name="gstin"><Input maxLength={15} /></Form.Item>
            <Form.Item label="Your state" name="state"><Input maxLength={80} /></Form.Item>
            <Form.Item label="GST rate %" name="gstRate"><InputNumber min={0} max={28} step={0.5} style={numberStyle} /></Form.Item>
            <Form.Item label="HSN code" name="hsnCode"><Input maxLength={8} /></Form.Item>
          </div>
        </Section>
        <Section title="Policies">
          <Form.Item label="Return policy" name="returnPolicy"><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
          <Form.Item label="Privacy policy" name="privacyPolicy"><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
          <Form.Item label="Terms and conditions" name="terms"><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
        </Section>
        <Section title="Banners">
          <Form.List name="banners">
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map(({ key, name }) => (
                  <div key={key} className="grid sm:grid-cols-2 gap-x-4 items-start rounded-fabric border border-line p-4">
                    <Form.Item label="Banner title" name={[name, 'title']}><Input maxLength={100} /></Form.Item>
                    <Form.Item label="Image URL" name={[name, 'imageUrl']}><Input placeholder="https://..." maxLength={500} /></Form.Item>
                    <Form.Item label="Link URL" name={[name, 'linkUrl']}><Input placeholder="https://..." maxLength={500} /></Form.Item>
                    <div className="flex items-center justify-between"><Form.Item label="Active" name={[name, 'isActive']} valuePropName="checked" className="!mb-0"><Switch /></Form.Item><Button danger type="text" icon={<Trash2 size={16} />} onClick={() => remove(name)}>Remove</Button></div>
                  </div>
                ))}
                {fields.length < 10 && <Button onClick={() => add({ title: '', imageUrl: '', linkUrl: '', isActive: true })} icon={<Plus size={16} />}>Add banner</Button>}
              </div>
            )}
          </Form.List>
        </Section>
        <div className="flex justify-end"><Button type="primary" htmlType="submit" loading={saving}>Save settings</Button></div>
      </Form>
    </div>
  );
}
