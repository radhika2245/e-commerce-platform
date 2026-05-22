import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import formatINR from '../utils/formatINR';
import axios from 'axios';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    axios.get('/api/orders')
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="page orders-page">
      <Helmet>
        <title>My Orders - Nebula</title>
        <meta name="description" content="View your order history." />
      </Helmet>

      <div className="page-header">
        <h1>My Orders</h1>
        <p>View your order history and status</p>
      </div>

      {loading ? (
        <div className="skeleton-list">
          {[1,2,3].map(i => <div key={i} className="skeleton-order" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <FiPackage size={48} />
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">Order #{order.id.slice(-8).toUpperCase()}</div>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
              </div>
              <div className="order-body">
                {order.items?.slice(0, 3).map(item => (
                  <div key={item.id} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>Qty: {item.quantity} × ₹{formatINR(item.price)}</span>
                    </div>
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <div className="order-more">+{order.items.length - 3} more items</div>
                )}
              </div>
              <div className="order-footer">
                <span className="order-total">₹{formatINR(order.total)}</span>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
