import { useLocation, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { message } from 'antd';
import useAuth from '@/hooks/useAuth';
import useWishlist from '@/hooks/useWishlist';

/** Heart toggle. Signed-out visitors are sent to sign in and returned to the page they were on. */
export default function WishlistButton({ productId, productName, className = '' }) {
  const { user } = useAuth();
  const { has, toggle } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = has(productId);

  const onClick = async () => {
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    try {
      const nowSaved = await toggle(productId);
      message.success(nowSaved ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (e) {
      message.error(e.message);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={`h-10 w-10 grid place-items-center bg-white/95 border border-line rounded-full cursor-pointer shadow-card ${className}`}
    >
      <Heart size={18} className={saved ? 'fill-accent-dark text-accent-dark' : 'text-primary'} />
    </button>
  );
}
