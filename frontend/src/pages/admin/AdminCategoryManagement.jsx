import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Switch, Table, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import ImageUploader from '@/components/forms/ImageUploader';
import CategoryVisual from '@/components/common/CategoryVisual';
import ErrorMessage from '@/components/common/ErrorMessage';
import { createCategory, deleteCategory, listAdminCategories, updateCategory } from '@/services/api/adminApi';

export default function AdminCategoryManagement() {
  usePageTitle('Categories');
  const [state, setState] = useState({ rows: [], loading: true, error: '' });
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form] = Form.useForm();

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listAdminCategories().then((r) => setState({ rows: r.data, loading: false, error: '' })).catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  }, []);
  useEffect(load, [load]);

  const open = (category) => {
    setFormError('');
    setEditing(category);
    form.resetFields();
    form.setFieldsValue(category === 'new' ? { isActive: true, sortOrder: state.rows.length, images: [] } : { ...category, images: category.image?.url ? [category.image] : [] });
  };

  const save = async (values) => {
    setSaving(true);
    setFormError('');
    try {
      const { images, ...rest } = values;
      const payload = { ...rest, slug: rest.slug || undefined, image: images?.[0] ? { url: images[0].url, publicId: images[0].publicId } : undefined };
      if (editing === 'new') await createCategory(payload); else await updateCategory(editing._id, payload);
      message.success('Category saved');
      setEditing(null);
      load();
    } catch (e) { setFormError(e.message); } finally { setSaving(false); }
  };

  const remove = async (c) => { try { await deleteCategory(c._id); message.success('Category deleted'); load(); } catch (e) { message.error(e.message, 6); } };

  const columns = [
    { title: '', key: 'img', width: 64, render: (_, c) => <div className="h-12 w-12 bg-secondary"><CategoryVisual category={c} className="h-full w-full" depth={2} /></div> },
    { title: 'Category', key: 'name', render: (_, c) => <span><strong className="text-primary">{c.name}</strong><span className="block text-xs text-ink/60">/{c.slug}</span></span> },
    { title: 'Products', dataIndex: 'productCount', key: 'productCount', align: 'right' },
    { title: 'Order', dataIndex: 'sortOrder', key: 'sortOrder', align: 'right', responsive: ['md'] },
    { title: 'Visible', key: 'active', render: (_, c) => (c.isActive ? <Tag color="green" className="!m-0">Shown</Tag> : <Tag className="!m-0">Hidden</Tag>) },
    { title: 'Actions', key: 'actions', render: (_, c) => (
      <span className="flex gap-2 whitespace-nowrap">
        <Button size="small" onClick={() => open(c)}>Edit</Button>
        <Popconfirm title="Delete this category?" description={c.productCount ? `${c.productCount} products use it, so this will be refused.` : 'This cannot be undone.'} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => remove(c)}><Button size="small" danger>Delete</Button></Popconfirm>
      </span>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-4xl">Categories</h1><p className="m-0 mt-1 text-ink/60">Shown in the store menu, footer and home page in this order.</p></div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => open('new')}>Add category</Button>
      </div>
      {state.error ? <ErrorMessage title="Could not load categories" message={state.error} onRetry={load} /> : <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} pagination={false} scroll={{ x: 'max-content' }} />}

      <Modal open={Boolean(editing)} onCancel={() => setEditing(null)} footer={null} destroyOnHidden title={editing === 'new' ? 'Add category' : 'Edit category'} width={560} forceRender>
        {formError && <Alert type="error" showIcon message={formError} className="!mb-4" />}
        <Form form={form} layout="vertical" requiredMark={false} onFinish={save}>
          <Form.Item label="Name" name="name" rules={[{ required: true, whitespace: true, message: 'Enter the category name' }]}><Input maxLength={80} /></Form.Item>
          <Form.Item label="Short description" name="description"><Input.TextArea rows={2} maxLength={300} showCount /></Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Slug (optional)" name="slug" extra="Empty creates it from the name"><Input placeholder="cotton" /></Form.Item>
            <Form.Item label="Display order" name="sortOrder"><InputNumber style={{ width: '100%' }} precision={0} /></Form.Item>
          </div>
          <Form.Item label="Image" name="images" extra="Without an image the store shows a generated fabric swatch."><ImageUploader max={1} label="Add image" /></Form.Item>
          <Form.Item label="Show in the store" name="isActive" valuePropName="checked"><Switch /></Form.Item>
          <div className="flex gap-3"><Button type="primary" htmlType="submit" loading={saving}>Save category</Button><Button onClick={() => setEditing(null)}>Cancel</Button></div>
        </Form>
      </Modal>
    </div>
  );
}
