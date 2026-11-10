import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Dropdown, message } from 'antd';
import { ChevronDown, Heart, Mail, Menu, Phone, ShoppingBag, User } from 'lucide-react';
import SearchBar from '@/components/common/SearchBar';
import MegaMenu from '@/components/common/MegaMenu';
import MobileNavDrawer from '@/components/common/MobileNavDrawer';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import useWishlist from '@/hooks/useWishlist';
import { BRAND, CONTACT, roleHome } from '@/utils/constants';

const navClass = ({ isActive }) =>
  `px-3 py-2 no-underline font-medium whitespace-nowrap ${isActive ? 'text-accent-dark' : 'text-primary hover:text-accent-dark'}`;

const iconButton = 'h-10 w-10 md:h-11 md:w-11 grid place-items-center text-primary hover:text-accent-dark';

export default function Header() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const wrapperRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const accountMenu = {
    items: [
      { key: 'who', label: <span className="text-ink/60">{user?.email}</span>, disabled: true },
      ...(user?.role === 'customer' ? [
        { key: '/account', label: 'My dashboard' },
        { key: '/account/orders', label: 'My orders' },
        { key: '/account/profile', label: 'Profile' },
      ] : [{ key: roleHome(user?.role), label: user?.role === 'admin' ? 'Admin dashboard' : 'Staff dashboard' }]),
      { type: 'divider' },
      { key: 'logout', label: 'Log out' },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') { logout(); message.success('Signed out'); navigate('/'); } else navigate(key);
    },
  };

  useEffect(() => { setMegaOpen(false); setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setMegaOpen(false);
    const onClick = (e) => wrapperRef.current && !wrapperRef.current.contains(e.target) && setMegaOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, []);

  return (
    <>
      <div className="hidden md:block bg-primary text-white/85 text-sm">
        <div className="container-page flex justify-between py-2">
          <span>Wholesale only. GST invoice on every order.</span>
          <span className="flex gap-6">
            <a href={CONTACT.phoneHref} className="flex items-center gap-2 text-white/85 no-underline hover:text-white"><Phone size={14} />{CONTACT.phone}</a>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 text-white/85 no-underline hover:text-white"><Mail size={14} />{CONTACT.email}</a>
          </span>
        </div>
      </div>

      <header ref={wrapperRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-line" onMouseLeave={() => setMegaOpen(false)}>
        <div className="container-page flex items-center gap-2 md:gap-4 h-16 md:h-[72px]">
          <button type="button" className={`lg:hidden -ml-3 bg-transparent border-0 cursor-pointer ${iconButton}`} aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Menu size={22} />
          </button>

          <Link to="/" className="flex items-center gap-2 md:gap-3 no-underline shrink-0 min-w-0" aria-label={`${BRAND.name} home`}>
            <span className="weave h-8 w-8 md:h-9 md:w-9 rounded-fabric border border-accent shrink-0" aria-hidden="true" />
            <span className="font-display text-base xs:text-lg md:text-2xl text-primary md:tracking-wide whitespace-nowrap">NARANG <span className="font-normal text-accent-dark">TEXTILE</span></span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:flex items-center ml-6">
            <button
              type="button"
              className="px-3 py-2 flex items-center gap-1 font-medium whitespace-nowrap text-primary hover:text-accent-dark bg-transparent border-0 cursor-pointer"
              aria-expanded={megaOpen}
              aria-controls="fabrics-mega-menu"
              onMouseEnter={() => setMegaOpen(true)}
              onClick={() => setMegaOpen((v) => !v)}
            >
              Wholesale range <ChevronDown size={16} className={`transition-transform ${megaOpen ? 'rotate-180' : ''}`} />
            </button>
            <NavLink to="/products" end className={navClass}>Products</NavLink>
            <NavLink to="/about" className={navClass}>About</NavLink>
            <NavLink to="/contact" className={navClass}>Contact</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <SearchBar className="hidden xl:block w-56 mr-2" placeholder="Search products" />
            <Link to="/account/wishlist" className={`${iconButton} hidden md:grid`} aria-label={wishlistCount ? `Wishlist, ${wishlistCount} saved` : 'Wishlist'}>
              <Badge count={wishlistCount} size="small" color="#B89A65" offset={[2, -2]}><Heart size={20} className="text-primary" /></Badge>
            </Link>
            {user ? (
              <Dropdown menu={accountMenu} trigger={['click']} placement="bottomRight">
                <button type="button" className={`${iconButton} bg-transparent border-0 cursor-pointer`} aria-label={`Account menu for ${user.name}`}><User size={20} /></button>
              </Dropdown>
            ) : (
              <Link to="/login" className={iconButton} aria-label="Sign in"><User size={20} /></Link>
            )}
            <Link to="/cart" className={iconButton} aria-label={itemCount ? `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Cart'}>
              <Badge count={itemCount} size="small" color="#B89A65" offset={[2, -2]}><ShoppingBag size={20} className="text-primary" /></Badge>
            </Link>
            <Link to="/quote" className="btn-primary !py-2 !px-4 ml-2 hidden xl:inline-flex whitespace-nowrap no-underline">Request quote</Link>
          </div>
        </div>
        <MegaMenu open={megaOpen} onNavigate={() => setMegaOpen(false)} />
      </header>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
