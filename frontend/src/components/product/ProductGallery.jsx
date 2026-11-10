import { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import FabricSwatch from '@/components/common/FabricSwatch';

/**
 * Main image with hover-zoom (desktop) and tap-to-zoom (touch), plus thumbnails when there are several images.
 * Falls back to the generated swatch while a product has no photos.
 */
export default function ProductGallery({ images = [], swatch, name }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const current = images[index];

  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ on: true, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div>
      <div
        className="relative aspect-[4/5] bg-secondary border border-line overflow-hidden cursor-zoom-in"
        onMouseMove={move}
        onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
        onClick={(e) => (e.pointerType === 'touch' || window.matchMedia('(hover: none)').matches) && setZoom((z) => ({ ...z, on: !z.on, x: 50, y: 50 }))}
      >
        <div className="h-full w-full p-6 transition-transform duration-150 ease-out" style={{ transform: zoom.on ? 'scale(2.2)' : 'scale(1)', transformOrigin: `${zoom.x}% ${zoom.y}%` }}>
          {current ? (
            <img src={current.url} alt={current.alt || name} className="h-full w-full object-cover" />
          ) : (
            <FabricSwatch swatch={swatch} className="h-full w-full" />
          )}
        </div>
        <span className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 text-xs flex items-center gap-1 rounded-fabric pointer-events-none"><ZoomIn size={14} /> Zoom</span>
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 list-none m-0 p-0">
          {images.map((img, i) => (
            <li key={img.url}>
              <button type="button" onClick={() => setIndex(i)} aria-label={`Show image ${i + 1}`} aria-current={i === index} className={`block w-full aspect-square border-2 p-0 cursor-pointer bg-secondary ${i === index ? 'border-accent-dark' : 'border-line'}`}>
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
