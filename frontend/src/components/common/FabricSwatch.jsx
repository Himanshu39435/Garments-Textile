const TEETH = 16;

/** Zig-zag "pinked" edge along the top and bottom, like a cut fabric sample. */
function pinkedClip(depth) {
  const top = [];
  const bottom = [];
  for (let i = 0; i <= TEETH; i += 1) {
    top.push(`${(i * 100) / TEETH}% ${i % 2 ? `${depth}px` : '0px'}`);
  }
  for (let i = TEETH; i >= 0; i -= 1) {
    bottom.push(`${(i * 100) / TEETH}% ${i % 2 ? `calc(100% - ${depth}px)` : '100%'}`);
  }
  return `polygon(${[...top, ...bottom].join(', ')})`;
}

const W = (a, b) => [
  `repeating-linear-gradient(0deg, rgba(255,255,255,${a}) 0 1px, transparent 1px 3px)`,
  `repeating-linear-gradient(90deg, rgba(0,0,0,${b}) 0 1px, transparent 1px 3px)`,
];

/** CSS texture per fabric type. Temporary stand-in until real product photos are uploaded. */
function texture({ type, color, accent }) {
  const base = { backgroundColor: color };
  switch (type) {
    case 'printed':
      return {
        ...base,
        backgroundImage: [`radial-gradient(circle at 25% 25%, ${accent} 0 5px, transparent 6px)`, `radial-gradient(circle at 75% 70%, #B89A65 0 4px, transparent 5px)`, ...W(0.25, 0.05)].join(', '),
        backgroundSize: '38px 38px, 38px 38px, auto, auto',
      };
    case 'embroidered':
      return {
        ...base,
        backgroundImage: [`radial-gradient(circle, ${accent} 0 2px, transparent 2.6px)`, `radial-gradient(circle, ${accent} 0 1.4px, transparent 2px)`, ...W(0.3, 0.05)].join(', '),
        backgroundSize: '26px 26px, 26px 26px, auto, auto',
        backgroundPosition: '0 0, 13px 13px, 0 0, 0 0',
      };
    case 'linen':
      return { ...base, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0 2px, transparent 2px 7px), repeating-linear-gradient(0deg, rgba(255,255,255,.28) 0 1px, transparent 1px 11px), repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 1px, transparent 1px 5px)' };
    case 'blended':
      return { ...base, backgroundImage: 'radial-gradient(rgba(255,255,255,.3) 1px, transparent 1.6px), radial-gradient(rgba(0,0,0,.14) 1px, transparent 1.6px)', backgroundSize: '5px 5px', backgroundPosition: '0 0, 2px 2px' };
    default:
      return { ...base, backgroundImage: W(0.35, 0.08).join(', ') };
  }
}

/**
 * Generated fabric sample with a pinked edge.
 * `className` positions/sizes the wrapper. `label` and `sublabel` render as a tag on the sample.
 */
export default function FabricSwatch({ swatch, label, sublabel, className = '', labelClassName = '', depth = 7 }) {
  return (
    <div className={`relative drop-shadow-[0_14px_18px_rgba(20,43,59,0.22)] ${className}`}>
      <div className="absolute inset-0" style={{ ...texture(swatch), clipPath: pinkedClip(depth) }} role="img" aria-label={label ? `${label} fabric sample` : 'Fabric sample'} />
      {label && (
        <div className={`absolute bottom-3 left-3 right-3 bg-white/95 px-3 py-2 text-left rounded-fabric ${labelClassName}`}>
          <p className="font-display text-sm text-primary leading-tight">{label}</p>
          {sublabel && <p className="text-xs text-ink/70">{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
