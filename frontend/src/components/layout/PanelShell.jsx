import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Store } from 'lucide-react';
import { message } from 'antd';
import useAuth from '@/hooks/useAuth';
import { BRAND } from '@/utils/constants';

/**
 * Back-office shell shared by the admin and staff areas, separate from the storefront: dark side navigation on desktop,
 * a two-row top bar on smaller screens. AdminLayout.jsx and StaffLayout.jsx only decide the label, home path and links.
 */
export default function PanelShell({ panelName, homePath, links, contentId }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); message.success('Signed out'); navigate('/login'); };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 no-underline whitespace-nowrap rounded-fabric ${isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`;
  const action = 'flex items-center gap-3 px-3 py-2 no-underline whitespace-nowrap rounded-fabric text-white/75 hover:bg-white/10 hover:text-white bg-transparent border-0 cursor-pointer text-base text-left w-full';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr] bg-secondary">
      <a href={`#${contentId}`} className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-3">Skip to content</a>
      <aside className="sticky top-0 z-30 weave text-white lg:h-screen lg:max-h-screen lg:overflow-y-auto lg:overscroll-contain flex flex-wrap lg:flex-col items-center lg:items-stretch gap-x-2 gap-y-1 lg:gap-6 p-3 lg:p-5">
        <Link to={homePath} className="order-1 no-underline text-white shrink-0 lg:px-3 lg:pt-2">
          <span className="font-display text-lg lg:text-xl block text-white">{BRAND.name}</span>
          <span className="hidden lg:block text-sm text-white/60">{panelName}</span>
        </Link>
        <nav aria-label={panelName} className="order-3 lg:order-2 w-full lg:w-auto flex lg:flex-col gap-1 lg:flex-1 overflow-x-auto">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}><Icon size={18} aria-hidden="true" /><span className="hidden md:inline">{label}</span><span className="sr-only md:hidden">{label}</span></NavLink>
          ))}
        </nav>
        <div className="order-2 lg:order-3 flex lg:flex-col gap-1 ml-auto lg:ml-0 lg:border-t lg:border-white/15 lg:pt-4">
          <p className="hidden lg:block m-0 px-3 text-sm text-white/60 truncate" title={user.email}>{user.name}{user.designation ? ` · ${user.designation}` : ''}</p>
          <Link to="/" className={linkClass({ isActive: false })}><Store size={18} aria-hidden="true" /><span className="hidden md:inline">View store</span><span className="sr-only md:hidden">View store</span></Link>
          <button type="button" onClick={signOut} className={action}><LogOut size={18} aria-hidden="true" /><span className="hidden md:inline">Sign out</span><span className="sr-only md:hidden">Sign out</span></button>
        </div>
      </aside>
      <main id={contentId} className="min-w-0 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
