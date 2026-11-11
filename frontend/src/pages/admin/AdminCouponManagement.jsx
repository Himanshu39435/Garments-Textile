import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Switch, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import usePageTitle from '@/hooks/usePageTitle';
import ErrorMessage from '@/components/common/ErrorMessage';
import { createAdminCoupon, deleteAdminCoupon, listAdminCoupons, updateAdminCoupon } from '@/services/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';

const inputWidth = { width: '100%' };

function discountLabel(coupon) {
  return coupon.discountType === 'percent'
    ? `${coupon.discountValue}%${coupon.maxDiscount ? ` (max ${formatCurrency(coupon.maxDiscount)})` : ''}`
    : formatCurrency(coupon.discountValue);
}

export default function AdminCouponManagement() {
  usePageTitle('Coupons');
  const [form] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const discountType = Form.useWatch('discountType', form);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    listAdminCoupons().then((response) => setRows(response.data)).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const showCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ discountType: 'percent', minimumOrder: 0, isActive: true });
    setOpen(true);
  };
  const showEdit = (coupon) => {
    setEditing(coupon);
    form.setFieldsValue({
      code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount, minimumOrder: coupon.minimumOrder, expiresAt: coupon.expiresAt ? dayjs(coupon.expiresAt).format('YYYY-MM-DD') : '',
      isActive: coupon.isActive,
    });
    setOpen(true);
  };
  const submit = async (values) => {
    setSaving(true);
    setError('');
    const payload = {
      ...values, code: values.code.trim().toUpperCase(), maxDiscount: values.maxDiscount ?? null,
      expiresAt: values.expiresAt || null,
    };
    try {
      if (editing) await updateAdminCoupon(editing._id, payload);
      else await createAdminCoupon(payload);
      message.success(editing ? 'Coupon updated' : 'Coupon created');
      setOpen(false);
      load();
    } catch (reason) { setError(reason.message); }
    finally { setSaving(false); }
  };
  const remove = async (id) => {
    try {
      await deleteAdminCoupon(id);
      message.success('Coupon deleted');
      load();
    } catch (reason) { setError(reason.message); }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', render: (code) => <strong className="font-mono text-primary">{code}</strong> },
    { title: 'Discount', key: 'discount', render: (_, coupon) => discountLabel(coupon) },
    { title: 'Min order', dataIndex: 'minimumOrder', key: 'minimumOrder', render: (value) => formatCurrency(value) },
    { title: 'Used', dataIndex: 'used', key: 'used' },
    { title: 'Expires', dataIndex: 'expiresAt', key: 'expiresAt', render: (value) => value ? dayjs(value).format('DD MMM YYYY') : 'Never' },
    { title: 'Active', dataIndex: 'isActive', key: 'active', render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag> },
    { title: 'Actions', key: 'actions', render: (_, coupon) => <div className="flex items-center gap-2"><Button onClick={() => showEdit(coupon)}>Edit</Button><Popconfirm title="Delete this coupon?" onConfirm={() => remove(coupon._id)}><Button danger type="text">Delete</Button></Popconfirm></div> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl">Coupons</h1><Button type="primary" onClick={showCreate}>Add coupon</Button></div>
      {error && <ErrorMessage title="Coupon operation failed" message={error} onRetry={load} />}
      <Table rowKey="_id" columns={columns} dataSource={rows} loading={loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'No coupons yet. Add one to get started.' }} />
      <Modal title={editing ? 'Edit coupon' : 'Add coupon'} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={submit} className="pt-4">
          {error && <Alert type="error" showIcon title={error} closable onClose={() => setError('')} className="mb-4" />}
          <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Enter a coupon code' }, { pattern: /^[A-Za-z0-9_-]{3,30}$/, message: 'Use 3 to 30 letters, numbers, - or _' }]}><Input maxLength={30} style={{ textTransform: 'uppercase' }} /></Form.Item>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Form.Item label="Discount type" name="discountType" rules={[{ required: true }]}><Select options={[{ value: 'percent', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount' }]} /></Form.Item>
            <Form.Item label="Discount value" name="discountValue" rules={[{ required: true, message: 'Enter a discount' }]}><InputNumber min={0.01} max={discountType === 'percent' ? 100 : undefined} precision={2} style={inputWidth} /></Form.Item>
            <Form.Item label="Max discount (₹)" name="maxDiscount" extra="Optional; applies to percentage discounts"><InputNumber min={0} precision={2} style={inputWidth} /></Form.Item>
            <Form.Item label="Minimum order (₹)" name="minimumOrder" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={inputWidth} /></Form.Item>
            <Form.Item label="Expires (YYYY-MM-DD)" name="expiresAt"><Input type="date" /></Form.Item>
            <Form.Item label="Active" name="isActive" valuePropName="checked"><Switch /></Form.Item>
          </div>
          <div className="flex justify-end gap-2"><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={saving}>{editing ? 'Save changes' : 'Add coupon'}</Button></div>
        </Form>
      </Modal>
    </div>
  );
}
