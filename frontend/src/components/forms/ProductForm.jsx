import { useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Select, Space, Switch } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/forms/ImageUploader';

const FABRIC_TYPES = ['cotton', 'printed', 'embroidered', 'blended'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const num = { style: { width: '100%' } };
const Section = ({ title, hint, children }) => (
  <section className="surface p-5 md:p-6" aria-label={title}>
    <h2 className="text-xl mb-1">{title}</h2>
    {hint && <p className="mt-0 mb-4 text-sm text-ink/60">{hint}</p>}
    {children}
  </section>
);

/**
 * Create/edit product form. `onSubmit(payload)` must return a promise: server rule violations
 * (error.details = [{ field, message }]) are shown on the matching fields.
 */
export default function ProductForm({ initialValues, categories, onSubmit, submitting, submitLabel = 'Save product', onCancel }) {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const price = Form.useWatch('price', form);

  const handleFinish = async (values) => {
    setError('');
    try {
      await onSubmit({
        ...values,
        category: typeof values.category === 'object' ? values.category?._id : values.category,
        colors: values.colors ?? [], bulkPricing: values.bulkPricing ?? [], images: values.images ?? [], specifications: values.specifications ?? [], tags: values.tags ?? [],
        hsnCode: values.hsnCode || undefined, gstPercent: values.gstPercent ?? undefined, slug: values.slug || undefined,
      });
    } catch (e) {
      setError(e.message);
      const fields = (e.details ?? []).filter((d) => d.field && !d.field.includes('.')).map((d) => ({ name: d.field, errors: [d.message] }));
      if (fields.length) form.setFields(fields);
    }
  };

  return (
    <Form form={form} layout="vertical" requiredMark={false} initialValues={initialValues} onFinish={handleFinish} onValuesChange={() => error && setError('')} scrollToFirstError className="space-y-6">
      {error && <Alert type="error" showIcon title={error} closable onClose={() => setError('')} />}

      <Section title="Basics">
        <div className="grid md:grid-cols-2 gap-x-4">
          <Form.Item label="Product name" name="name" rules={[{ required: true, whitespace: true, message: 'Enter the product name' }]}><Input maxLength={140} /></Form.Item>
          <Form.Item label="SKU" name="sku" rules={[{ required: true, message: 'Enter a SKU' }, { pattern: /^[A-Za-z0-9][A-Za-z0-9_-]{2,29}$/, message: '3 to 30 characters: letters, numbers, - or _' }]} extra="Must be unique. Saved in capitals."><Input maxLength={30} style={{ textTransform: 'uppercase' }} /></Form.Item>
          <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Choose a category' }]}><Select placeholder="Select category" options={categories.map((c) => ({ value: c._id, label: c.name }))} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item label="Fabric type" name="fabricType" rules={[{ required: true, message: 'Choose a fabric type' }]} extra="Used by the Fabric filter on the store."><Select placeholder="Select type" options={FABRIC_TYPES.map((t) => ({ value: t, label: cap(t) }))} /></Form.Item>
        </div>
        <Form.Item label="Description" name="description"><Input.TextArea rows={4} maxLength={4000} showCount /></Form.Item>
        <Form.Item label="Web address slug (optional)" name="slug" extra="Leave empty to create it from the name. Changing it breaks old links to this product."><Input placeholder="cotton-poplin-plain" /></Form.Item>
      </Section>

      <Section title="Fabric details">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-x-4">
          <Form.Item label="Composition" name="composition" rules={[{ required: true, whitespace: true, message: 'Enter the composition' }]} className="sm:col-span-2"><Input placeholder="100% Cotton" maxLength={120} /></Form.Item>
          <Form.Item label="GSM" name="gsm" rules={[{ required: true, message: 'Enter the GSM' }]}><InputNumber {...num} min={10} max={1000} /></Form.Item>
          <Form.Item label="Width (inches)" name="width" rules={[{ required: true, message: 'Enter the width' }]}><InputNumber {...num} min={10} max={120} /></Form.Item>
          <Form.Item label="HSN code" name="hsnCode" extra="Printed on invoices" rules={[{ pattern: /^\d{4,8}$/, message: '4 to 8 digits' }]}><Input maxLength={8} inputMode="numeric" /></Form.Item>
          <Form.Item label="GST %" name="gstPercent" extra="Empty uses the store default"><InputNumber {...num} min={0} max={28} step={0.5} /></Form.Item>
        </div>
      </Section>

      <Section title="Pricing and stock" hint="Prices are per metre, before GST.">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-x-4">
          <Form.Item label="Price per metre (₹)" name="price" rules={[{ required: true, message: 'Enter the price' }]}><InputNumber {...num} min={0} precision={2} /></Form.Item>
          <Form.Item label="Minimum order (m)" name="moq" rules={[{ required: true, message: 'Enter the minimum order' }]}><InputNumber {...num} min={1} precision={0} /></Form.Item>
          <Form.Item label="Stock (m)" name="stock" rules={[{ required: true, message: 'Enter the stock' }]}><InputNumber {...num} min={0} precision={0} /></Form.Item>
          <Form.Item label="Low-stock alert at (m)" name="lowStockThreshold"><InputNumber {...num} min={0} precision={0} /></Form.Item>
        </div>
        <h3 className="text-base font-semibold mb-2">Bulk price slabs</h3>
        <p className="mt-0 mb-3 text-sm text-ink/60">The first slab starts at the minimum order and each later quantity must be higher. Each price must be lower than the one before (base price: {price ?? '…'}).</p>
        <Form.List name="bulkPricing">
          {(fields, { add, remove }) => (
            <div className="space-y-2">
              {fields.map(({ key, name }) => (
                <div key={key} className="flex flex-wrap items-start gap-3">
                  <Form.Item name={[name, 'minQty']} rules={[{ required: true, message: 'Quantity' }]} className="!mb-0">
                    <Space.Compact>
                      <InputNumber min={1} precision={0} aria-label="Slab quantity" />
                      <span className="inline-flex items-center border border-l-0 border-line bg-secondary px-3 text-sm text-ink/70">m and above</span>
                    </Space.Compact>
                  </Form.Item>
                  <Form.Item name={[name, 'price']} rules={[{ required: true, message: 'Price' }]} className="!mb-0">
                    <Space.Compact>
                      <span className="inline-flex items-center border border-r-0 border-line bg-secondary px-3 text-sm text-ink/70">₹</span>
                      <InputNumber min={0.01} precision={2} aria-label="Slab price" />
                      <span className="inline-flex items-center border border-l-0 border-line bg-secondary px-3 text-sm text-ink/70">per m</span>
                    </Space.Compact>
                  </Form.Item>
                  <Button type="text" danger onClick={() => remove(name)} aria-label={`Remove slab ${name + 1}`} icon={<Trash2 size={16} />} />
                </div>
              ))}
              {fields.length < 6 && <Button onClick={() => add()} icon={<Plus size={16} />}>Add slab</Button>}
            </div>
          )}
        </Form.List>
      </Section>

      <Section title="Colours" hint="Shown as swatches on the product page and used by the Colour filter.">
        <Form.List name="colors">
          {(fields, { add, remove }) => (
            <div className="space-y-2">
              {fields.map(({ key, name }) => (
                <div key={key} className="flex flex-wrap items-start gap-3">
                  <Form.Item name={[name, 'name']} rules={[{ required: true, whitespace: true, message: 'Colour name' }]} className="!mb-0"><Input placeholder="Colour name" maxLength={40} aria-label="Colour name" /></Form.Item>
                  <Form.Item name={[name, 'hex']} rules={[{ required: true, message: 'Pick a colour' }]} className="!mb-0"><input type="color" aria-label="Colour value" className="h-8 w-14 p-0 border border-line bg-white cursor-pointer" /></Form.Item>
                  <Button type="text" danger onClick={() => remove(name)} aria-label={`Remove colour ${name + 1}`} icon={<Trash2 size={16} />} />
                </div>
              ))}
              {fields.length < 20 && <Button onClick={() => add({ hex: '#1f4258' })} icon={<Plus size={16} />}>Add colour</Button>}
            </div>
          )}
        </Form.List>
      </Section>

      <Section title="Images" hint="The first image is the main one. Without images the store shows a generated fabric swatch.">
        <Form.Item name="images" noStyle><ImageUploader /></Form.Item>
      </Section>

      <Section title="Specifications and search">
        <Form.List name="specifications">
          {(fields, { add, remove }) => (
            <div className="space-y-2 mb-4">
              {fields.map(({ key, name }) => (
                <div key={key} className="flex flex-wrap items-start gap-3">
                  <Form.Item name={[name, 'label']} rules={[{ required: true, whitespace: true, message: 'Label' }]} className="!mb-0"><Input placeholder="e.g. Weave" maxLength={60} aria-label="Specification label" /></Form.Item>
                  <Form.Item name={[name, 'value']} rules={[{ required: true, whitespace: true, message: 'Value' }]} className="!mb-0"><Input placeholder="e.g. Plain" maxLength={200} aria-label="Specification value" /></Form.Item>
                  <Button type="text" danger onClick={() => remove(name)} aria-label={`Remove specification ${name + 1}`} icon={<Trash2 size={16} />} />
                </div>
              ))}
              {fields.length < 20 && <Button onClick={() => add()} icon={<Plus size={16} />}>Add specification</Button>}
            </div>
          )}
        </Form.List>
        <Form.Item label="Search tags" name="tags" extra="Type a tag and press Enter."><Select mode="tags" tokenSeparators={[',']} open={false} placeholder="voile, summer, handloom" /></Form.Item>
      </Section>

      <Section title="Visibility">
        <Form.Item label="Status" name="status" extra="Only Active products appear on the store. Archived keeps order history but hides the product."><Select options={[{ value: 'draft', label: 'Draft (hidden)' }, { value: 'active', label: 'Active (visible)' }, { value: 'archived', label: 'Archived (hidden)' }]} style={{ maxWidth: 260 }} /></Form.Item>
        <div className="flex flex-wrap gap-8">
          <Form.Item label="Best seller badge" name="isBestSeller" valuePropName="checked" className="!mb-0"><Switch /></Form.Item>
          <Form.Item label="New arrival badge" name="isNewArrival" valuePropName="checked" className="!mb-0"><Switch /></Form.Item>
        </div>
      </Section>

      <div className="flex gap-3 sticky bottom-0 bg-secondary/95 backdrop-blur py-3 border-t border-line">
        <Button type="primary" htmlType="submit" loading={submitting} size="large">{submitLabel}</Button>
        {onCancel && <Button size="large" onClick={onCancel}>Cancel</Button>}
      </div>
    </Form>
  );
}
