import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { FileText, Heart, LayoutDashboard, LogOut, MapPin, Package, ShoppingBag, UserRound } from 'lucide-react';
import { message } from 'antd';
import useAuth from '@/hooks/useAuth';
import { BRAND } from '@/utils/constants';

const LINKS = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/quotations', label: 'Quotations', icon: FileText },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/profile', label: 'Profile', icon: UserRound },
];

/** Customer account shell: full-height side navigation on desktop, compact navigation on phones. */
export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 no-underline whitespace-nowrap rounded-fabric ${isActive ? 'bg-accent text-primary font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white'}`;
  const signOut = () => { logout(); message.success('Signed out'); navigate('/login'); };
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[290px_1fr] bg-secondary">
      <aside className="sticky top-0 z-30 weave text-white lg:h-screen lg:max-h-screen lg:overflow-y-auto p-4 md:p-5 flex flex-wrap lg:flex-col gap-3 lg:gap-8">
        <Link to="/account" className="no-underline text-white px-3 py-2 shrink-0">
          <span className="font-display text-2xl block text-white">{BRAND.name}</span>
          <span className="text-sm text-white/65">My account</span>
        </Link>
        <nav aria-label="Account" className="order-3 lg:order-2 w-full flex lg:flex-col gap-1 overflow-x-auto">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}><Icon size={19} aria-hidden="true" />{label}</NavLink>
          ))}
          <NavLink to="/" className={linkClass}><ShoppingBag size={19} aria-hidden="true" />Continue shopping</NavLink>
        </nav>
        <div className="order-2 lg:order-3 ml-auto lg:ml-0 lg:mt-auto w-auto lg:w-full">
          <p className="hidden lg:block px-4 mb-2 text-sm text-white/65 truncate" title={user.email}>{user.name}</p>
          <button type="button" onClick={signOut} className={`${linkClass({ isActive: false })} w-full border-0 bg-transparent cursor-pointer text-base text-left`}>
            <LogOut size={19} aria-hidden="true" />Logout
          </button>
        </div>
      </aside>
      <main className="min-w-0">
        <div className="border-b border-line bg-secondary px-5 py-5 md:px-10">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
            <span className="font-display text-xl text-primary">My account</span>
            <span className="text-sm text-ink/60">{user.name}<span className="block text-right">Customer</span></span>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto p-5 md:p-10"><Outlet /></div>
      </main>
    </div>
  );
}
