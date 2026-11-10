import { Boxes, ClipboardList, FileText, LayoutDashboard, Tags, UserCog, Users } from 'lucide-react';
import PanelShell from '@/components/layout/PanelShell';

/** Each admin area gets an entry here when it is built. Inventory, reports and settings arrive in Phase 10. */
const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Boxes },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/quotations', label: 'Quotations', icon: FileText },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/staff', label: 'Staff', icon: UserCog },
];

/** Admin back office at /admin. The shell itself lives in PanelShell.jsx. */
export default function AdminLayout() {
  return <PanelShell panelName="Admin panel" homePath="/admin" links={LINKS} contentId="admin-content" />;
}
