import { Drawer } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import SearchBar from '@/components/common/SearchBar';
import useCategoryList from '@/hooks/useCategoryList';
import { BRAND, CONTACT, roleHome } from '@/utils/constants';

/** Slide-in navigation for screens below 1024px. */
export default function MobileNavDrawer({ open, onClose }) {
  const categories = useCategoryList();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = 'block py-3 text-primary no-underline border-b border-line';
  return (
    <Drawer open={open} onClose={onClose} placement="left" size={320} title={<span className="font-display text-primary">{BRAND.name}</span>}>
      <SearchBar onSearched={onClose} className="mb-4" />
      <nav aria-label="Mobile">
        <p className="mt-2 mb-0 text-sm font-semibold text-ink/60">Fabrics</p>
        {categories.map((c) => (
          <Link key={c.slug} to={`/category/${c.slug}`} onClick={onClose} className={link}>{c.name}</Link>
        ))}
        <Link to="/products" onClick={onClose} className={`${link} font-semibold`}>All fabrics</Link>
        <Link to="/quote" onClick={onClose} className={link}>Request a quote</Link>
        <Link to="/about" onClick={onClose} className={link}>About</Link>
        <Link to="/contact" onClick={onClose} className={link}>Contact</Link>
        <Link to="/account/wishlist" onClick={onClose} className={link}>Wishlist</Link>
        {user ? (
          <>
            {user.role === 'customer' ? (
              <>
                <Link to="/account" onClick={onClose} className={link}>My dashboard ({user.name.split(' ')[0]})</Link>
                <Link to="/account/orders" onClick={onClose} className={link}>My orders</Link>
              </>
            ) : (
              <Link to={roleHome(user.role)} onClick={onClose} className={link}>{user.role === 'admin' ? 'Admin dashboard' : 'Staff dashboard'} ({user.name.split(' ')[0]})</Link>
            )}
            <button type="button" onClick={() => { logout(); onClose(); navigate('/'); }} className={`${link} w-full text-left bg-transparent border-x-0 border-t-0 cursor-pointer text-base`}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={onClose} className={link}>Sign in</Link>
            <Link to="/register" onClick={onClose} className={link}>Create account</Link>
          </>
        )}
      </nav>
      <p className="mt-6 text-sm text-ink/70">{CONTACT.phone}<br />{CONTACT.email}</p>
    </Drawer>
  );
}
