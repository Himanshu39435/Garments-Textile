import FabricSwatch from '@/components/common/FabricSwatch';

const DEFAULT_SWATCH = { type: 'cotton', color: '#E9E3D3', accent: '#B89A65' };

/** A category's photo when it has one, otherwise a generated fabric swatch. */
export default function CategoryVisual({ category, className = '', depth = 7 }) {
  if (category.image?.url) return <img src={category.image.url} alt="" loading="lazy" className={`object-cover ${className}`} />;
  return <FabricSwatch swatch={category.swatch ?? DEFAULT_SWATCH} className={className} depth={depth} />;
}
