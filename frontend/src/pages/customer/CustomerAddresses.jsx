import { useEffect, useState } from 'react';
import { Button, Modal, Popconfirm, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import AddressForm from '@/components/forms/AddressForm';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { createAddress, deleteAddress, listAddresses, updateAddress } from '@/services/api/customerApi';

const MAX = 10;

export default function CustomerAddresses() {
  usePageTitle('My addresses');
  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [saving, setSaving] = useState(false);

  const load = () => { setError(''); listAddresses().then((r) => setAddresses(r.data)).catch((e) => setError(e.message)); };
  useEffect(load, []);

  const save = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, isDefault: Boolean(values.isDefault) };
      if (editing === 'new') await createAddress(payload); else await updateAddress(editing._id, payload);
      setEditing(null);
      message.success('Address saved');
      load();
    } catch (e) { message.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (a) => { try { await deleteAddress(a._id); message.success('Address removed'); load(); } catch (e) { message.error(e.message); } };
  const makeDefault = async (a) => { try { await updateAddress(a._id, { ...a, isDefault: true }); load(); } catch (e) { message.error(e.message); } };

  if (error) return <ErrorMessage title="Could not load addresses" message={error} onRetry={load} />;
  if (!addresses) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">My addresses</h1>
        <Button type="primary" icon={<Plus size={16} />} disabled={addresses.length >= MAX} onClick={() => setEditing('new')}>Add address</Button>
      </div>
      {addresses.length === 0 ? (
        <div className="surface p-10 text-center text-ink/70">No saved addresses yet. Add one to speed up checkout.</div>
      ) : (
        <ul className="list-none m-0 p-0 grid md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <li key={a._id} className="surface p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <strong className="text-primary">{a.fullName}{a.label ? ` · ${a.label}` : ''}</strong>
                {a.isDefault && <Tag color="gold" className="!m-0">Default</Tag>}
              </div>
              <p className="my-2 text-ink/80">{a.companyName && <>{a.companyName}<br /></>}{[a.line1, a.line2].filter(Boolean).join(', ')}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
              <div className="mt-auto pt-2 flex flex-wrap gap-2">
                <Button size="small" onClick={() => setEditing(a)}>Edit</Button>
                {!a.isDefault && <Button size="small" onClick={() => makeDefault(a)}>Make default</Button>}
                <Popconfirm title="Remove this address?" okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => remove(a)}><Button size="small" danger>Remove</Button></Popconfirm>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(editing)} onCancel={() => setEditing(null)} footer={null} destroyOnHidden width={640} title={editing === 'new' ? 'Add an address' : 'Edit address'}>
        <AddressForm initialValues={editing === 'new' ? undefined : editing} onSubmit={save} onCancel={() => setEditing(null)} submitting={saving} />
      </Modal>
    </div>
  );
}
