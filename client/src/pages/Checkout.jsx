import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiCreditCard, FiShield, FiCheck, FiTruck, FiTag, FiPlus, FiMapPin } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const FREE_SHIPPING_THRESHOLD = 4999;
const SHIPPING_COST = 499;

function formatINR(n) {
  const str = String(Math.round(n));
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  if (!rest) return last3;
  const chunks = [];
  let r = rest;
  while (r.length > 0) {
    chunks.push(r.slice(-2));
    r = r.slice(0, -2);
  }
  return chunks.reverse().join(',') + ',' + last3;
}

function StripeForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');
    const { error: submitError } = await elements.submit();
    if (submitError) { setError(submitError.message); setProcessing(false); return; }
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/products` },
      redirect: 'if_required',
    });
    if (payError) { setError(payError.message); setProcessing(false); return; }
    await onSuccess(paymentIntent?.id || null, 'stripe');
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <PaymentElement />
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary pay-btn" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay with Card'}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [method, setMethod] = useState('stripe');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', name: '', phone: '', street: '', city: '', state: '', pincode: '' });
  const [savingAddress, setSavingAddress] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });

  const shipping = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount = coupon ? (totalPrice >= coupon.minOrder ? Math.min(coupon.discount, totalPrice) : 0) : 0;
  const finalTotal = totalPrice + shipping - discount;

  useEffect(() => {
    if (!Array.isArray(cart) || cart.length === 0) return;
    setClientSecret('');
    api.post('/api/payment/create-payment-intent', { items: cart, discount, currency: 'inr' })
      .then(res => setClientSecret(res.data.clientSecret))
      .catch(() => toast('Payment system unavailable', 'error'));
  }, [cart, totalPrice, discount]);

  useEffect(() => {
    if (!user) return;
    api.get('/api/auth/addresses')
      .then(res => {
        const addrList = Array.isArray(res.data) ? res.data : [];
        setAddresses(addrList);
        const def = addrList.find(a => a.isDefault);
        if (def) setSelectedAddress(def);
        else if (addrList.length > 0) setSelectedAddress(addrList[0]);
      }).catch(() => {});
  }, [user]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('Enter a coupon code'); return; }
    setCheckingCoupon(true);
    setCouponError('');
    try {
      const { data } = await api.post('/api/coupons/validate', { code: couponCode, orderTotal: totalPrice });
      setCoupon(data);
      toast('Coupon applied!', 'success');
    } catch (err) {
      setCoupon(null);
      setCouponError(err.response?.data?.error || 'Invalid coupon');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const { data } = await api.post('/api/auth/addresses', addressForm);
      setAddresses(prev => [...(Array.isArray(prev) ? prev : []), data]);
      setSelectedAddress(data);
      setShowAddressForm(false);
      toast('Address added', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async (paymentId, paymentMethod) => {
    const customer = user
      ? { name: user.name, email: user.email, phone: selectedAddress?.phone || '' }
      : { name: guestInfo.name, email: guestInfo.email, phone: guestInfo.phone };
    const orderPayload = {
      items: cart,
      customer,
      paymentId,
      paymentMethod,
      discount,
      couponCode: coupon?.coupon?.code || null,
    };
    if (selectedAddress) orderPayload.customer.address = selectedAddress;
    try {
      await api.post('/api/orders', orderPayload);
      if (coupon?.coupon?.id) {
        await api.post(`/api/coupons/${coupon.coupon.id}/use`);
      }
      clearCart();
      toast('Order placed successfully!', 'success');
      navigate('/orders');
    } catch (err) {
      toast(err.response?.data?.error || 'Order creation failed', 'error');
    }
  };

  const handlePaymentSuccess = async (paymentId, paymentMethod) => {
    await placeOrder(paymentId, paymentMethod);
  };

  const handleCODSubmit = async () => {
    if (!selectedAddress && user) { toast('Please select a delivery address', 'error'); return; }
    if (!user && (!guestInfo.name || !guestInfo.email)) { toast('Please fill your details', 'error'); return; }
    await placeOrder(null, 'cod');
  };

  if (!Array.isArray(cart) || cart.length === 0) {
    return (
      <div className="page checkout-page">
        <Helmet><title>Checkout - Radhika</title></Helmet>
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add some items before checking out.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkout-page">
      <Helmet><title>Checkout - Radhika</title></Helmet>
      <div className="page-header"><h1>Checkout</h1><p>Complete your purchase</p></div>

      {/* Guest info */}
      {!user && (
        <div className="checkout-section">
          <h3><FiTruck size={18} /> Your Details</h3>
          <div className="guest-form">
            <input placeholder="Full name *" value={guestInfo.name} onChange={e => setGuestInfo({...guestInfo, name: e.target.value})} />
            <input placeholder="Email *" type="email" value={guestInfo.email} onChange={e => setGuestInfo({...guestInfo, email: e.target.value})} />
            <input placeholder="Phone" value={guestInfo.phone} onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})} />
          </div>
        </div>
      )}

      {/* Saved addresses */}
      {user && (
        <div className="checkout-section">
          <h3><FiMapPin size={18} /> Delivery Address</h3>
          {(!Array.isArray(addresses) || addresses.length === 0) && !showAddressForm && (
            <p className="text-secondary" style={{ marginBottom: 12 }}>No saved addresses.</p>
          )}
          <div className="address-list">
            {Array.isArray(addresses) && addresses.map(addr => (
              <button
                key={addr.id}
                className={`address-card ${selectedAddress?.id === addr.id ? 'active' : ''}`}
                onClick={() => setSelectedAddress(addr)}
              >
                <strong>{addr.label}</strong>
                <span>{addr.name} — {addr.phone}</span>
                <span>{addr.street}, {addr.city}, {addr.state} — {addr.pincode}</span>
              </button>
            ))}
          </div>
          {showAddressForm ? (
            <form onSubmit={handleAddAddress} className="address-form">
              <div className="form-row">
                <input placeholder="Label (Home/Work)" value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} />
                <input placeholder="Full name *" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <input placeholder="Phone *" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} required />
                <input placeholder="Pincode *" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} required />
              </div>
              <input placeholder="Street / Area *" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} required />
              <div className="form-row">
                <input placeholder="City *" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} required />
                <input placeholder="State *" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} required />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={savingAddress}>
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddressForm(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="btn-secondary" onClick={() => setShowAddressForm(true)} style={{ marginTop: 8 }}>
              <FiPlus size={14} /> Add New Address
            </button>
          )}
        </div>
      )}

      {/* Coupon */}
      <div className="checkout-section">
        <h3><FiTag size={18} /> Coupon Code</h3>
        <div className="coupon-row">
          <input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value.toUpperCase())}
            disabled={!!coupon}
          />
          {coupon ? (
            <button className="btn-secondary" onClick={() => { setCoupon(null); setCouponCode(''); }}>
              Remove
            </button>
          ) : (
            <button className="btn-primary" onClick={handleApplyCoupon} disabled={checkingCoupon}>
              {checkingCoupon ? '...' : 'Apply'}
            </button>
          )}
        </div>
        {coupon && <p className="coupon-success">Coupon applied! You save ₹{formatINR(coupon.discount)}</p>}
        {couponError && <p className="error-text">{couponError}</p>}
      </div>

      {/* Payment method */}
      <div className="payment-method-selector">
        <button className={`pm-btn ${method === 'stripe' ? 'active' : ''}`} onClick={() => setMethod('stripe')}>
          <span className="pm-icon"><FiCreditCard /></span>
          <span className="pm-info"><strong>Stripe</strong><small>Credit / Debit Card</small></span>
          {method === 'stripe' && <FiCheck className="pm-check" />}
        </button>
        <button className={`pm-btn ${method === 'cod' ? 'active' : ''}`} onClick={() => setMethod('cod')}>
          <span className="pm-icon"><FiTruck /></span>
          <span className="pm-info"><strong>Cash on Delivery</strong><small>Pay when delivered</small></span>
          {method === 'cod' && <FiCheck className="pm-check" />}
        </button>
      </div>

      <div className="checkout-layout">
        <div className="checkout-order-review">
          <h3>Order Summary</h3>
          {Array.isArray(cart) && cart.map(item => (
            <div key={item.id} className="checkout-item">
              <img src={item.image} alt={item.name} />
              <div><h4>{item.name}</h4><p>Qty: {item.quantity}</p></div>
              <span>₹{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="checkout-total">
            <div className="summary-row"><span>Subtotal</span><span>₹{formatINR(totalPrice)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${formatINR(shipping)}`}</span></div>
            {discount > 0 && <div className="summary-row discount"><span>Discount</span><span>-₹{formatINR(discount)}</span></div>}
            <div className="summary-row total"><strong>Total</strong><strong>₹{formatINR(finalTotal)}</strong></div>
          </div>
        </div>

        <div className="checkout-payment">
          <h3>Payment</h3>
          <div className="payment-security"><FiShield aria-hidden="true" /> Secured with SSL encryption</div>
          {method === 'stripe' ? (
            clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}><StripeForm onSuccess={handlePaymentSuccess} /></Elements>
            ) : <div className="loading">Preparing checkout...</div>
          ) : (
            <div className="cod-section">
              <p className="cod-info">Pay when your order is delivered. No online payment needed.</p>
              <button className="btn-primary cod-btn" onClick={handleCODSubmit}>
                Place Order (COD)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
