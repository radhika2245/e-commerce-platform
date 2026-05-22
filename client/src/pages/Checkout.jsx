import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiCreditCard, FiShield, FiCheck } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

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

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function StripeForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
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

function RazorpayButton({ amount, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    const loaded = await loadRazorpayScript();
    if (!loaded) { setError('Failed to load Razorpay SDK'); setLoading(false); return; }
    try {
      const { data } = await axios.post('/api/razorpay/create-order', { amount, currency: 'INR' });
      const options = {
        key: RAZORPAY_KEY,
        amount: data.amount,
        currency: data.currency,
        name: 'Nebula Store',
        description: 'Premium Products',
        order_id: data.id,
        handler: (response) => { onSuccess(response.razorpay_payment_id, 'razorpay'); },
        prefill: { name: 'Customer', email: 'customer@example.com', contact: '9999999999' },
        theme: { color: '#7ec8e3' },
        modal: { ondismiss: () => setLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => { setError(response.error.description || 'Payment failed'); setLoading(false); });
      rzp.open();
    } catch { setError('Failed to initiate payment'); setLoading(false); }
  };

  return (
    <div className="razorpay-section">
      <button className="btn-primary razorpay-btn" onClick={handlePayment} disabled={loading}>
        {loading ? 'Opening Razorpay...' : `Pay ₹${formatINR(amount)} via Razorpay`}
      </button>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [clientSecret, setClientSecret] = useState('');
  const [method, setMethod] = useState('razorpay');
  const navigate = useNavigate();

  useEffect(() => {
    if (cart.length === 0) return;
    setClientSecret('');
    axios.post('/api/payment/create-payment-intent', { amount: totalPrice, currency: 'inr' })
      .then(res => setClientSecret(res.data.clientSecret))
      .catch(() => toast('Payment system unavailable', 'error'));
  }, [cart, totalPrice]);

  const handlePaymentSuccess = async (paymentId, paymentMethod) => {
    try {
      await axios.post('/api/orders', {
        items: cart,
        customer: { name: user?.name || 'Customer', email: user?.email || 'customer@example.com' },
        paymentId,
        paymentMethod,
      });
      clearCart();
      toast('Order placed successfully!', 'success');
      navigate('/products');
    } catch {
      toast('Order creation failed', 'error');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page checkout-page">
        <Helmet><title>Checkout - Nebula</title></Helmet>
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add some items before checking out.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkout-page">
      <Helmet><title>Checkout - Nebula</title></Helmet>
      <div className="page-header"><h1>Checkout</h1><p>Complete your purchase</p></div>

      <div className="payment-method-selector">
        <button className={`pm-btn ${method === 'razorpay' ? 'active' : ''}`} onClick={() => setMethod('razorpay')}>
          <span className="pm-icon"><FiCreditCard /></span>
          <span className="pm-info"><strong>Razorpay</strong><small>UPI, Card, Net Banking, Wallet</small></span>
          {method === 'razorpay' && <FiCheck className="pm-check" />}
        </button>
        <button className={`pm-btn ${method === 'stripe' ? 'active' : ''}`} onClick={() => setMethod('stripe')}>
          <span className="pm-icon"><FiCreditCard /></span>
          <span className="pm-info"><strong>Stripe</strong><small>Credit / Debit Card</small></span>
          {method === 'stripe' && <FiCheck className="pm-check" />}
        </button>
      </div>

      <div className="checkout-layout">
        <div className="checkout-order-review">
          <h3>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="checkout-item">
              <img src={item.image} alt={item.name} />
              <div><h4>{item.name}</h4><p>Qty: {item.quantity}</p></div>
              <span>₹{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="checkout-total"><strong>Total: ₹{formatINR(totalPrice)}</strong></div>
        </div>

        <div className="checkout-payment">
          <h3>Payment</h3>
          <div className="payment-security"><FiShield aria-hidden="true" /> Secured with 256-bit SSL encryption</div>
          {method === 'razorpay' ? (
            <RazorpayButton amount={totalPrice} onSuccess={handlePaymentSuccess} />
          ) : (
            clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}><StripeForm onSuccess={handlePaymentSuccess} /></Elements>
            ) : <div className="loading">Preparing checkout...</div>
          )}
        </div>
      </div>
    </div>
  );
}
