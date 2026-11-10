import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, DatePicker, Input, InputNumber, Select, message } from 'antd';
import { Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { getProduct, listProducts } from '@/services/api/productApi';
import { requestQuotation } from '@/services/api/quotationApi';

const toLine = (p, quantity) => ({ productId: p._id, name: p.name, sku: p.sku, moq: p.moq, unit: p.unit ?? 'm', listPrice: p.price, quantity: quantity ?? p.bulkPricing?.[0]?.minQty ?? p.moq, requestedPrice: undefined });
const optionOf = (p) => ({ value: p._id, label: `${p.name} (${p.sku}) · MOQ ${p.moq} m`, product: p });

/**
 * Quote request: pick fabrics, set quantities (and optionally a target price), add notes and a delivery date.
 * `initialProductSlug` pre-fills one fabric (from the "Request a quote" button on a product page).
 */
export default function QuoteRequestForm({ initialProductSlug, onSubmitted }) {
  const [lines, setLines] = useState([]);
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [notes, setNotes] = useState('');
  const [requiredBy, setRequiredBy] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef();

  const search = useCallback((text) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSearching(true);
      listProducts({ search: text || undefined, limit: 8, sort: 'popular' }).then((r) => setOptions(r.data.map(optionOf))).catch(() => {}).finally(() => setSearching(false));
    }, text ? 300 : 0);
  }, []);
  useEffect(() => { search(''); return () => clearTimeout(timer.current); }, [search]);

  useEffect(() => {
    if (!initialProductSlug) return;
    getProduct(initialProductSlug).then((r) => setLines((l) => (l.some((x) => x.productId === r.data._id) ? l : [...l, toLine(r.data)]))).catch(() => {});
  }, [initialProductSlug]);

  const add = (_, option) => {
    const p = option.product;
    setLines((l) => {
      if (l.some((x) => x.productId === p._id)) { message.info(`${p.name} is already on your request`); return l; }
      return [...l, toLine(p)];
    });
  };
  const patch = (id, change) => setLines((l) => l.map((x) => (x.productId === id ? { ...x, ...change } : x)));

  const submit = async () => {
    setError('');
    if (lines.length === 0) { setError('Add at least one fabric to your request.'); return; }
    const short = lines.find((l) => !Number.isInteger(l.quantity) || l.quantity < l.moq);
    if (short) { setError(`${short.name}: enter a whole number of metres, at least ${short.moq}.`); return; }
    setSubmitting(true);
    try {
      const { data } = await requestQuotation({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, requestedPrice: l.requestedPrice || undefined })),
        notes: notes.trim() || undefined,
        requiredBy: requiredBy ? requiredBy.format('YYYY-MM-DD') : undefined,
      });
      onSubmitted(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError('')} />}

      <section className="surface p-5 md:p-6" aria-labelledby="qr-fabrics">
        <h2 id="qr-fabrics" className="text-xl mb-3">Fabrics</h2>
        <Select aria-label="Search fabrics to add" className="w-full" showSearch value={null} placeholder="Search by name, SKU or fabric type, then pick to add" filterOption={false} onSearch={search} onSelect={add} options={options} loading={searching} notFoundContent={searching ? 'Searching' : 'No fabrics found'} size="large" />
        {lines.length === 0 ? <p className="mt-4 mb-0 text-ink/60">No fabrics added yet.</p> : (
          <ul className="list-none m-0 mt-4 p-0 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.productId} className="py-4 flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1 basis-48"><strong className="text-primary">{l.name}</strong><span className="block text-sm text-ink/60">{l.sku} · list price ₹{l.listPrice} per {l.unit} · MOQ {l.moq} {l.unit}</span></div>
                <label className="text-sm">Quantity ({l.unit})<br /><InputNumber aria-label={`Quantity of ${l.name}`} min={l.moq} precision={0} value={l.quantity} onChange={(v) => patch(l.productId, { quantity: v })} style={{ width: 130 }} /></label>
                <label className="text-sm">Target price/m (optional)<br /><InputNumber aria-label={`Target price for ${l.name}`} min={0.01} precision={2} value={l.requestedPrice} onChange={(v) => patch(l.productId, { requestedPrice: v ?? undefined })} addonBefore="₹" style={{ width: 170 }} /></label>
                <button type="button" onClick={() => setLines((x) => x.filter((y) => y.productId !== l.productId))} aria-label={`Remove ${l.name}`} className="mt-5 h-9 w-9 grid place-items-center bg-transparent border-0 text-red-700 cursor-pointer"><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface p-5 md:p-6" aria-labelledby="qr-details">
        <h2 id="qr-details" className="text-xl mb-3">Details</h2>
        <label htmlFor="qr-date" className="block mb-1 text-sm">Needed by (optional)</label>
        <DatePicker id="qr-date" value={requiredBy} onChange={setRequiredBy} disabledDate={(d) => d.isBefore(dayjs(), 'day') || d.isAfter(dayjs().add(365, 'day'))} />
        <label htmlFor="qr-notes" className="block mt-4 mb-1 text-sm">Notes for our team (optional)</label>
        <Input.TextArea id="qr-notes" rows={4} maxLength={1000} showCount value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Colours, custom prints, packing, delivery location, payment terms you would like to discuss" />
      </section>

      <Button type="primary" size="large" loading={submitting} onClick={submit}>Send quote request</Button>
    </div>
  );
}
