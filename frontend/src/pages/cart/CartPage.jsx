import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useCart from '@/hooks/useCart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function CartPage() {
  usePageTitle('Your cart');
  const { cart, loading, updateItem, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  const act = async (productId, task, success) => {
    setBusyId(productId);
    try { await task(); if (success) message.success(success); } catch (e) { message.error(e.message); } finally { setBusyId(null); }
  };

  if (loading && cart.itemCount === 0) return <LoadingSpinner fullPage />;

  if (cart.itemCount === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-ink/70">Browse the catalogue and add fabrics by the metre.</p>
        <Link to="/products" className="btn-primary mt-6 no-underline">Browse fabrics</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <h1 className="text-4xl">Your cart</h1>
        <button type="button" onClick={() => act('all', clear, 'Cart cleared')} className="bg-transparent border-0 text-primary underline cursor-pointer">Clear cart</button>
      </div>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <ul className="list-none m-0 p-0 space-y-4" aria-label="Cart items">
          {cart.items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              busy={busyId === item.productId || busyId === 'all'}
              onQuantityChange={(q) => act(item.productId, () => updateItem(item.productId, q))}
              onRemove={() => act(item.productId, () => removeItem(item.productId), 'Removed from cart')}
            />
          ))}
        </ul>
        <CartSummary totals={cart.totals}>
          {cart.hasIssues && <p role="alert" className="mt-0 mb-3 text-sm text-red-700">Fix the items marked above to continue.</p>}
          <button type="button" className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" disabled={cart.hasIssues} onClick={() => navigate('/checkout')}>Proceed to checkout</button>
          <p className="mt-3 mb-0 text-sm text-ink/60">GST is shown by tax type once you choose a delivery address.</p>
        </CartSummary>
      </div>
    </div>
  );
}
