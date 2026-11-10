import { Button, Checkbox, Form, Input, Select } from 'antd';
import { INDIAN_STATES } from '@/utils/indianStates';
import { nameRules, phoneRules } from '@/utils/validateForm';

const PINCODE = /^[1-9]\d{5}$/;

/** Create/edit an address. Calls onSubmit(values) with { stateCode } chosen from the GST state list. */
export default function AddressForm({ initialValues, onSubmit, onCancel, submitting, submitLabel = 'Save address' }) {
  return (
    <Form layout="vertical" requiredMark={false} initialValues={initialValues} onFinish={onSubmit} autoComplete="on">
      <div className="grid md:grid-cols-2 gap-x-4">
        <Form.Item label="Recipient name" name="fullName" rules={nameRules}><Input autoComplete="name" /></Form.Item>
        <Form.Item label="Mobile number" name="phone" rules={phoneRules}><Input autoComplete="tel" inputMode="tel" /></Form.Item>
      </div>
      <Form.Item label="Company (optional)" name="companyName"><Input autoComplete="organization" /></Form.Item>
      <Form.Item label="Address line 1" name="line1" rules={[{ required: true, whitespace: true, message: 'Enter the street address' }]}><Input autoComplete="address-line1" /></Form.Item>
      <Form.Item label="Address line 2 (optional)" name="line2"><Input autoComplete="address-line2" /></Form.Item>
      <div className="grid md:grid-cols-3 gap-x-4">
        <Form.Item label="City" name="city" rules={[{ required: true, whitespace: true, message: 'Enter the city' }]}><Input autoComplete="address-level2" /></Form.Item>
        <Form.Item label="State" name="stateCode" rules={[{ required: true, message: 'Choose a state' }]}>
          <Select showSearch optionFilterProp="label" placeholder="Select state" options={INDIAN_STATES.map((s) => ({ value: s.code, label: s.name }))} />
        </Form.Item>
        <Form.Item label="Pincode" name="pincode" rules={[{ required: true, message: 'Enter the pincode' }, { pattern: PINCODE, message: 'Enter a valid 6-digit pincode' }]}><Input inputMode="numeric" maxLength={6} autoComplete="postal-code" /></Form.Item>
      </div>
      <Form.Item label="Label (optional)" name="label"><Input placeholder="Warehouse, head office" maxLength={40} /></Form.Item>
      <Form.Item name="isDefault" valuePropName="checked"><Checkbox>Use as my default address</Checkbox></Form.Item>
      <div className="flex gap-3">
        <Button type="primary" htmlType="submit" loading={submitting}>{submitLabel}</Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </div>
    </Form>
  );
}
