import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox, Slider } from 'antd';
import { formatCurrency } from '@/utils/formatCurrency';

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const heading = 'font-display text-lg text-primary m-0 mb-3';

/**
 * Filter controls. Stateless about the URL: parent passes `values` and receives `onChange(patch)`.
 * values: { fabric: string[], color: string[], minPrice?: number, maxPrice?: number }
 */
export default function ProductFilters({ options, values, onChange, categories = [], activeCategory }) {
  const range = options?.price ?? { min: 0, max: 0 };
  const [priceRange, setPriceRange] = useState([range.min, range.max]);

  useEffect(() => {
    setPriceRange([values.minPrice ?? range.min, values.maxPrice ?? range.max]);
  }, [values.minPrice, values.maxPrice, range.min, range.max]);

  const toggle = (key, value) => {
    const current = values[key];
    onChange({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };

  const commitPrice = ([min, max]) =>
    onChange({ minPrice: min <= range.min ? undefined : min, maxPrice: max >= range.max ? undefined : max });

  return (
    <div className="space-y-8">
      {categories.length > 0 && (
        <section aria-labelledby="f-cat">
          <h2 id="f-cat" className={heading}>Category</h2>
          <ul className="list-none m-0 p-0 space-y-1">
            <li><Link to="/products" className={`no-underline ${!activeCategory ? 'font-semibold text-accent-dark' : 'text-primary'}`}>All fabrics</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} aria-current={activeCategory === c.slug ? 'page' : undefined} className={`no-underline ${activeCategory === c.slug ? 'font-semibold text-accent-dark' : 'text-primary'}`}>
                  {c.name} <span className="text-ink/50 text-sm">({c.productCount})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {range.max > range.min && (
        <section aria-labelledby="f-price">
          <h2 id="f-price" className={heading}>Price per piece</h2>
          <Slider range min={range.min} max={range.max} step={10} value={priceRange} onChange={setPriceRange} onChangeComplete={commitPrice} tooltip={{ formatter: (v) => formatCurrency(v) }} />
          <p className="m-0 text-sm text-ink/70">{formatCurrency(priceRange[0])} to {formatCurrency(priceRange[1])}</p>
        </section>
      )}

      {options?.fabricTypes?.length > 0 && (
        <section aria-labelledby="f-fabric">
          <h2 id="f-fabric" className={heading}>Fabric</h2>
          <div className="flex flex-col gap-2">
            {options.fabricTypes.map((f) => (
              <Checkbox key={f} checked={values.fabric.includes(f)} onChange={() => toggle('fabric', f)}>{titleCase(f)}</Checkbox>
            ))}
          </div>
        </section>
      )}

      {options?.colors?.length > 0 && (
        <section aria-labelledby="f-color">
          <h2 id="f-color" className={heading}>Colour</h2>
          <div className="flex flex-wrap gap-2">
            {options.colors.map((c) => {
              const on = values.color.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={on}
                  onClick={() => toggle('color', c.name)}
                  className={`h-8 w-8 rounded-full cursor-pointer border-2 ${on ? 'border-accent-dark ring-2 ring-accent/40' : 'border-line'}`}
                  style={{ background: c.hex }}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
