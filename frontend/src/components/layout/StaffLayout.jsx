import { Boxes, ClipboardList, FileText, LayoutDashboard, Users } from 'lucide-react';
import PanelShell from '@/components/layout/PanelShell';

/** Staff see the daily work only: orders, quotations, stock and customers. No categories, staff or money settings. */
const LINKS = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/orders', label: 'Orders', icon: ClipboardList },
  { to: '/staff/quotations', label: 'Quotations', icon: FileText },
  { to: '/staff/stock', label: 'Stock', icon: Boxes },
  { to: '/staff/customers', label: 'Customers', icon: Users },
];

/** Staff work area at /staff. The shell itself lives in PanelShell.jsx. */
export default function StaffLayout() {
  return <PanelShell panelName="Staff panel" homePath="/staff" links={LINKS} contentId="staff-content" />;
}
