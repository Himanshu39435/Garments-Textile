import { useRef, useState } from 'react';
import { ArrowLeftToLine, ImagePlus, Trash2 } from 'lucide-react';
import { Spin, message } from 'antd';
import { uploadImage } from '@/services/api/adminApi';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Multi-image field for antd Form.Item: value is [{ url, publicId, alt }], the first image is the main one.
 * Each file is uploaded as soon as it is chosen; the product is only changed when the form is saved.
 */
export default function ImageUploader({ value = [], onChange, max = 8, label = 'Add image' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (event) => {
    const files = [...event.target.files].slice(0, max - value.length);
    event.target.value = '';
    let next = [...value];
    setBusy(true);
    for (const file of files) {
      if (!TYPES.includes(file.type)) { message.error(`${file.name}: use a JPG, PNG or WebP image`); continue; }
      if (file.size > MAX_BYTES) { message.error(`${file.name}: images must be 5 MB or smaller`); continue; }
      try {
        const { data } = await uploadImage(file);
        next = [...next, { url: data.url, publicId: data.publicId, alt: '' }];
        onChange?.(next);
      } catch (e) {
        message.error(`${file.name}: ${e.message}`);
      }
    }
    setBusy(false);
  };

  const update = (index, patch) => onChange?.(value.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  const remove = (index) => onChange?.(value.filter((_, i) => i !== index));
  const makeMain = (index) => onChange?.([value[index], ...value.filter((_, i) => i !== index)]);

  return (
    <div>
      <ul className="list-none m-0 p-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {value.map((img, i) => (
          <li key={img.url} className="border border-line bg-white p-2 flex flex-col gap-2">
            <div className="relative aspect-square bg-secondary">
              <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5">Main</span>}
            </div>
            <input aria-label={`Description of image ${i + 1}`} value={img.alt ?? ''} onChange={(e) => update(i, { alt: e.target.value })} placeholder="Describe the image" maxLength={120} className="w-full border border-line px-2 py-1 text-sm" />
            <div className="flex justify-between">
              <button type="button" onClick={() => makeMain(i)} disabled={i === 0} aria-label={`Make image ${i + 1} the main image`} className="inline-flex items-center gap-1 text-sm bg-transparent border-0 text-primary cursor-pointer disabled:opacity-30 disabled:cursor-default p-0"><ArrowLeftToLine size={14} /> Main</button>
              <button type="button" onClick={() => remove(i)} aria-label={`Remove image ${i + 1}`} className="inline-flex items-center gap-1 text-sm bg-transparent border-0 text-red-700 cursor-pointer p-0"><Trash2 size={14} /> Remove</button>
            </div>
          </li>
        ))}
        {value.length < max && (
          <li>
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="w-full aspect-square border-2 border-dashed border-line bg-white text-primary grid place-items-center cursor-pointer hover:border-accent-dark disabled:opacity-60">
              {busy ? <Spin /> : <span className="flex flex-col items-center gap-1"><ImagePlus size={24} aria-hidden="true" /><span className="text-sm">{label}</span></span>}
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} hidden onChange={handleFiles} aria-label="Choose image files" />
      <p className="mt-2 mb-0 text-xs text-ink/60">JPG, PNG or WebP, up to 5 MB each ({value.length} of {max} used).</p>
    </div>
  );
}
