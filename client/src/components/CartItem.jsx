import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import formatINR from '../utils/formatINR';

const FALLBACK_IMG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%231a1a2e" width="200" height="200"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%237ec8e3" font-size="36">✦</text></svg>';

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();
  const toast = useToast();
  const [imgError, setImgError] = useState(false);

  if (!item || typeof item !== 'object') return null;

  const handleRemove = () => {
    removeItem(item.id);
    toast(`${item.name || 'Item'} removed from cart`, 'info');
  };

  const imgSrc = imgError || !item.image ? FALLBACK_IMG : item.image;

  return (
    <div className="cart-item" role="group" aria-label={`Cart item: ${item.name || 'Unknown item'}`}>
      <img
        src={imgSrc}
        alt={item.name || 'Product image'}
        className="cart-item-image"
        loading="lazy"
        onError={() => setImgError(true)}
      />
      <div className="cart-item-info">
        {item.brand && <span className="cart-item-brand">{item.brand}</span>}
        <h4>{item.name || 'Unknown Product'}</h4>
        {item.description && <p className="cart-item-desc">{item.description}</p>}
        <span className="cart-item-price">₹{formatINR(item.price || 0)}</span>
      </div>
      <div className="cart-item-controls">
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
          disabled={!item.quantity || item.quantity <= 1}
          aria-label={`Decrease quantity of ${item.name || 'item'}`}
        >−</button>
        <span className="qty-value" aria-label={`Quantity: ${item.quantity || 1}`}>{item.quantity || 1}</span>
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
          aria-label={`Increase quantity of ${item.name || 'item'}`}
        >+</button>
      </div>
      <span className="cart-item-total">₹{formatINR((item.price || 0) * (item.quantity || 1))}</span>
      <button
        className="cart-item-remove"
        onClick={handleRemove}
        aria-label={`Remove ${item.name || 'item'} from cart`}
      >
        <FiTrash2 size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
