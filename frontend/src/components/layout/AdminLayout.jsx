import { Boxes, ChartColumn, ClipboardList, CreditCard, FileText, LayoutDashboard, Settings2, Tags, TicketPercent, UserCog, Users } from 'lucide-react';
import PanelShell from '@/components/layout/PanelShell';

/** Admin navigation entries. Inventory uses the product list's low-stock filter. */
const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Boxes },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/quotations', label: 'Quotations', icon: FileText },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/staff', label: 'Staff', icon: UserCog },
  { to: '/admin/products?lowStock=true', label: 'Inventory / Stock', icon: Boxes },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/reports', label: 'Sales reports', icon: ChartColumn },
  { to: '/admin/settings', label: 'Website settings', icon: Settings2 },
];

/** Admin back office at /admin. The shell itself lives in PanelShell.jsx. */
export default function AdminLayout() {
  return <PanelShell panelName="Admin panel" homePath="/admin" links={LINKS} contentId="admin-content" />;
}
