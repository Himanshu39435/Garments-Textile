import { Tag } from 'antd';

const MAP = {
  requested: ['Awaiting quote', 'gold'], approved: ['Quote ready', 'blue'], expired: ['Expired', 'default'],
  converted: ['Ordered', 'green'], rejected: ['Declined by us', 'red'], cancelled: ['Cancelled', 'default'],
};

export default function QuotationStatusTag({ status }) {
  const [label, color] = MAP[status] ?? [status, 'default'];
  return <Tag color={color} className="!m-0">{label}</Tag>;
}
