import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiShoppingBag, FiTruck } from 'react-icons/fi';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';
import formatINR from '../utils/formatINR';

const FREE_SHIPPING_THRESHOLD = 4999;
const SHIPPING_COST = 499;

export default function Cart() {
  const { cart, totalPrice, totalItems } = useCart();
  const shipping = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = totalPrice + shipping;
  const freeProgress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - totalPrice;

  if (cart.length === 0) {
    return (
      <div className="page cart-page">
        <Helmet><title>Cart - Nebula</title></Helmet>
        <div className="empty-cart">
          <FiShoppingBag size={64} />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page cart-page">
      <Helmet><title>{`Cart (${String(totalItems)}) - Nebula`}</title></Helmet>
      <div className="page-header">
        <h1>Shopping Cart</h1>
        <p>{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
      </div>

      {shipping > 0 && (
        <div className="shipping-progress" role="status" aria-label={`₹${formatINR(remaining)} away from free shipping`}>
          <FiTruck aria-hidden="true" />
          <span>Add ₹{formatINR(remaining)} more for <strong>free shipping</strong></span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${freeProgress}%` }} />
          </div>
        </div>
      )}

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => <CartItem key={item.id} item={item} />)}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{formatINR(totalPrice)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `₹${formatINR(shipping)}`}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{formatINR(total)}</span>
          </div>
          <Link to="/checkout" className="btn-primary checkout-btn">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
