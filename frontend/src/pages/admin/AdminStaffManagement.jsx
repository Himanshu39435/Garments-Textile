import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Popconfirm, Table, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import ErrorMessage from '@/components/common/ErrorMessage';
import { createStaff, listStaff, resetStaffPassword, setStaffActive, updateStaff } from '@/services/api/adminApi';
import { emailRules, nameRules, passwordRules, phoneRules } from '@/utils/validateForm';
import { formatDate } from '@/utils/formatDate';

/** Admin only. Create staff logins, edit them, switch them off and reset their password. */
export default function AdminStaffManagement() {
  usePageTitle('Staff');
  const [state, setState] = useState({ rows: [], loading: true, error: '' });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | staff row
  const [resetting, setResetting] = useState(null); // null | staff row
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listStaff({ search: search.trim() || undefined })
      .then((r) => setState({ rows: r.data, loading: false, error: '' }))
      .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  }, [search]);
  useEffect(load, [load]);

  const openForm = (row) => { setFormError(''); setEditing(row); form.resetFields(); if (row !== 'new') form.setFieldsValue(row); };
  const openReset = (row) => { setFormError(''); setResetting(row); resetForm.resetFields(); };

  const save = async (values) => {
    setSaving(true); setFormError('');
    try {
      if (editing === 'new') await createStaff(values);
      else await updateStaff(editing._id, { name: values.name, phone: values.phone, designation: values.designation ?? '' });
      message.success(editing === 'new' ? 'Staff account created' : 'Staff member updated');
      setEditing(null); load();
    } catch (e) { setFormError(e.message); } finally { setSaving(false); }
  };
  const reset = async ({ newPassword }) => {
    setSaving(true); setFormError('');
    try { await resetStaffPassword(resetting._id, newPassword); message.success('Password reset. Share it with the staff member.'); setResetting(null); } catch (e) { setFormError(e.message); } finally { setSaving(false); }
  };
  const toggle = async (row) => { try { const r = await setStaffActive(row._id, !row.isActive); message.success(r.message); load(); } catch (e) { message.error(e.message); } };

  const columns = [
    { title: 'Name', key: 'name', render: (_, s) => <span><strong className="text-primary">{s.name}</strong><span className="block text-xs text-ink/60">{s.designation ?? 'No designation'}</span></span> },
    { title: 'Contact', key: 'contact', responsive: ['md'], render: (_, s) => <span><a href={`mailto:${s.email}`}>{s.email}</a><span className="block text-xs text-ink/60">{s.phone}</span></span> },
    { title: 'Last sign-in', dataIndex: 'lastLoginAt', key: 'lastLoginAt', responsive: ['lg'], render: (v) => (v ? formatDate(v) : <span className="text-ink/60">Never</span>) },
    { title: 'Actions (30 days)', dataIndex: 'actionsLast30Days', key: 'actions30', align: 'right', responsive: ['lg'] },
    { title: 'Status', key: 'status', render: (_, s) => (s.isActive ? <Tag color="green" className="!m-0">Active</Tag> : <Tag color="red" className="!m-0">Deactivated</Tag>) },
    { title: '', key: 'actions', render: (_, s) => (
      <span className="flex flex-wrap gap-2 whitespace-nowrap">
        <Button size="small" onClick={() => openForm(s)}>Edit</Button>
        <Button size="small" onClick={() => openReset(s)}>Reset password</Button>
        <Popconfirm title={s.isActive ? 'Deactivate this staff member?' : 'Reactivate this staff member?'} description={s.isActive ? 'They are signed out and cannot log in until reactivated. Their history is kept.' : undefined} okText={s.isActive ? 'Deactivate' : 'Reactivate'} okButtonProps={{ danger: s.isActive }} onConfirm={() => toggle(s)}>
          <Button size="small" danger={s.isActive}>{s.isActive ? 'Deactivate' : 'Reactivate'}</Button>
        </Popconfirm>
      </span>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-4xl">Staff</h1><p className="m-0 mt-1 text-sm text-ink/60">Staff sign in at the normal sign-in page and land on their own dashboard. They can work on orders and quotations, and view stock and customers. They cannot see revenue, edit products or categories, confirm payments, refund or cancel orders.</p></div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => openForm('new')}>Add staff member</Button>
      </div>
      <div className="surface p-4"><Input.Search aria-label="Search staff" placeholder="Search name, email or designation" allowClear value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} /></div>
      {state.error ? <ErrorMessage title="Could not load staff" message={state.error} onRetry={load} /> : (
        <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} scroll={{ x: 'max-content' }} pagination={false} locale={{ emptyText: 'No staff accounts yet. Add your first staff member.' }} />
      )}

      <Modal open={Boolean(editing)} title={editing === 'new' ? 'Add staff member' : 'Edit staff member'} onCancel={() => setEditing(null)} okText={editing === 'new' ? 'Create account' : 'Save'} onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden forceRender>
        <Form form={form} layout="vertical" onFinish={save} requiredMark={false}>
          {formError && <Alert type="error" showIcon message={formError} className="!mb-4" />}
          <Form.Item label="Full name" name="name" rules={nameRules}><Input autoComplete="off" /></Form.Item>
          <Form.Item label="Email (used to sign in)" name="email" rules={emailRules}><Input type="email" autoComplete="off" disabled={editing !== 'new'} /></Form.Item>
          <Form.Item label="Mobile number" name="phone" rules={phoneRules}><Input autoComplete="off" /></Form.Item>
          <Form.Item label="Designation (optional)" name="designation" rules={[{ max: 60 }]}><Input placeholder="e.g. Dispatch executive" /></Form.Item>
          {editing === 'new' && <Form.Item label="First password" name="password" rules={passwordRules} extra="Share this with the staff member. They can change it after signing in."><Input.Password autoComplete="new-password" /></Form.Item>}
        </Form>
      </Modal>

      <Modal open={Boolean(resetting)} title={resetting ? `Reset password for ${resetting.name}` : ''} onCancel={() => setResetting(null)} okText="Reset password" onOk={() => resetForm.submit()} confirmLoading={saving} destroyOnHidden forceRender>
        <Form form={resetForm} layout="vertical" onFinish={reset} requiredMark={false}>
          {formError && <Alert type="error" showIcon message={formError} className="!mb-4" />}
          <p className="mt-0 text-ink/70">They are signed out everywhere and must use the new password.</p>
          <Form.Item label="New password" name="newPassword" rules={passwordRules}><Input.Password autoComplete="new-password" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
