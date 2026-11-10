import { Tag } from 'antd';

const ORDER = { pending: ['Pending', 'gold'], confirmed: ['Confirmed', 'blue'], processing: ['Processing', 'geekblue'], shipped: ['Shipped', 'cyan'], delivered: ['Delivered', 'green'], cancelled: ['Cancelled', 'default'] };
const PAYMENT = { pending: ['Payment pending', 'gold'], awaiting_transfer: ['Awaiting transfer', 'gold'], paid: ['Paid', 'green'], failed: ['Payment failed', 'red'], refunded: ['Refunded', 'default'] };

const make = (map) => function StatusTag({ status }) {
  const [label, color] = map[status] ?? [status, 'default'];
  return <Tag color={color} className="!m-0">{label}</Tag>;
};

export const OrderStatusTag = make(ORDER);
export const PaymentStatusTag = make(PAYMENT);

/** Order status plus payment status. A cancelled order that was never paid shows only "Cancelled"; paid and refunded ones keep their payment badge. */
export function OrderTags({ order }) {
  const hidePayment = order.status === 'cancelled' && ['pending', 'awaiting_transfer', 'failed'].includes(order.paymentStatus);
  return (
    <>
      <OrderStatusTag status={order.status} />
      {!hidePayment && <PaymentStatusTag status={order.paymentStatus} />}
    </>
  );
}
