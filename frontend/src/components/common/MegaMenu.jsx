import { Link } from 'react-router-dom';
import CategoryVisual from '@/components/common/CategoryVisual';
import useCategoryList from '@/hooks/useCategoryList';

/** Desktop "Fabrics" panel. Rendered by Header, which controls `open`. */
export default function MegaMenu({ open, onNavigate }) {
  const categories = useCategoryList();
  if (!open) return null;
  return (
    <div id="fabrics-mega-menu" className="absolute left-0 right-0 top-full bg-white border-t border-line shadow-lift">
      <div className="container-page grid grid-cols-12 gap-8 py-8">
        <ul className="col-span-8 grid grid-cols-2 gap-x-8 gap-y-5 m-0 p-0 list-none">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link to={`/category/${category.slug}`} onClick={onNavigate} className="flex gap-4 items-start group no-underline">
                <CategoryVisual category={category} depth={3} className="h-14 w-14 shrink-0" />
                <span>
                  <span className="block font-display text-primary group-hover:text-accent-dark">{category.name}</span>
                  <span className="block text-sm text-ink/70">{category.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="col-span-4 weave text-white p-6 rounded-fabric flex flex-col justify-between">
          <div>
            <p className="font-display text-xl text-white">Buying 200 m or more?</p>
            <p className="mt-2 text-sm text-white/80">Bulk slab pricing and GST invoices come with every wholesale order.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/products" onClick={onNavigate} className="btn-accent !py-2 no-underline">All fabrics</Link>
            <Link to="/quote" onClick={onNavigate} className="btn !py-2 text-white border-white/60 hover:bg-white hover:text-primary no-underline">Request a quote</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
