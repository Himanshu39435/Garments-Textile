import { Link } from 'react-router-dom';
import { Checkbox, Input, Modal, Radio } from 'antd';
import { Plus } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import AddressForm from '@/components/forms/AddressForm';

function AddressOption({ a }) {
  return (
    <span className="block">
      <strong className="text-primary">{a.fullName}</strong>{a.label ? <span className="text-ink/60"> · {a.label}</span> : null}
      <span className="block text-sm text-ink/75">{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</span>
      <span className="block text-sm text-ink/60">{a.phone}</span>
    </span>
  );
}

/** Delivery, billing, payment and notes sections. State comes from useCheckoutDetails(). */
export default function CheckoutDetails({ details: d }) {
  const { user } = useAuth();
  const list = (selected, onChange, name) => (
    <Radio.Group value={selected} onChange={(e) => onChange(e.target.value)} className="!flex flex-col gap-3 w-full" name={name}>
      {d.addresses.map((a) => <Radio key={a._id} value={a._id} className="!items-start surface !p-4 !m-0 w-full"><AddressOption a={a} /></Radio>)}
    </Radio.Group>
  );
  const add = (target) => (
    <button type="button" onClick={() => d.setModalFor(target)} className="mt-3 inline-flex items-center gap-2 bg-transparent border-0 text-primary font-semibold cursor-pointer p-0"><Plus size={16} /> Add a new address</button>
  );

  return (
    <div className="space-y-8 min-w-0">
      <section aria-labelledby="ship">
        <h2 id="ship" className="text-2xl mb-3">Delivery address</h2>
        {d.addresses.length === 0 ? <p className="text-ink/70 mt-0">You have no saved addresses yet.</p> : list(d.shippingId, d.setShippingId, 'shipping')}
        {add('shipping')}
      </section>

      <section aria-labelledby="bill">
        <h2 id="bill" className="text-2xl mb-3">Billing address</h2>
        <Checkbox checked={d.billingSame} onChange={(e) => d.setBillingSame(e.target.checked)}>Same as delivery address</Checkbox>
        {!d.billingSame && <div className="mt-3">{list(d.billingId, d.setBillingId, 'billing')}{add('billing')}</div>}
        {user.business?.gstin
          ? <p className="mt-3 mb-0 text-sm text-ink/70">GSTIN on invoice: <strong>{user.business.gstin}</strong></p>
          : <p className="mt-3 mb-0 text-sm text-ink/70">No GSTIN on your profile. <Link to="/account/profile">Add it</Link> before ordering if you need input tax credit.</p>}
      </section>

      <section aria-labelledby="pay">
        <h2 id="pay" className="text-2xl mb-3">Payment</h2>
        <Radio.Group value={d.method} onChange={(e) => d.setMethod(e.target.value)} className="!flex flex-col gap-3" name="payment">
          <Radio value="razorpay" className="!items-start surface !p-4 !m-0"><span className="block"><strong className="text-primary">Pay online</strong><span className="block text-sm text-ink/70">UPI, cards and net banking through Razorpay.</span></span></Radio>
          <Radio value="bank_transfer" className="!items-start surface !p-4 !m-0"><span className="block"><strong className="text-primary">Bank transfer</strong><span className="block text-sm text-ink/70">Place the order now and pay by NEFT/RTGS. We confirm once the payment reaches us.</span></span></Radio>
        </Radio.Group>
      </section>

      <section aria-labelledby="notes-h">
        <h2 id="notes-h" className="text-2xl mb-3">Order notes (optional)</h2>
        <Input.TextArea aria-label="Order notes" rows={3} maxLength={500} showCount value={d.notes} onChange={(e) => d.setNotes(e.target.value)} placeholder="Delivery instructions, colour preferences" />
      </section>

      <Modal open={Boolean(d.modalFor)} onCancel={() => d.setModalFor(null)} footer={null} title="Add an address" destroyOnHidden width={640}>
        <AddressForm initialValues={{ fullName: user.name, phone: user.phone, companyName: user.business?.companyName }} onSubmit={d.saveAddress} onCancel={() => d.setModalFor(null)} submitting={d.savingAddress} />
      </Modal>
    </div>
  );
}
