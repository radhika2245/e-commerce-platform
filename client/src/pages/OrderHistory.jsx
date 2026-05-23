import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiPackage, FiChevronDown, FiChevronUp, FiCheck, FiTruck, FiClock, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import formatINR from '../utils/formatINR';
import axios from 'axios';

const STATUS_ICONS = {
  confirmed: FiClock,
  shipped: FiTruck,
  delivered: FiCheck,
  cancelled: FiX,
};

const STATUS_LABELS = {
  confirmed: 'Order Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  confirmed: '#f59e0b',
  shipped: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

function Timeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;
  return (
    <div className="order-timeline">
      {timeline.map((entry, i) => {
        const Icon = STATUS_ICONS[entry.status] || FiClock;
        const isLast = i === timeline.length - 1;
        return (
          <div key={i} className={`timeline-item ${isLast ? 'active' : ''}`}>
            <div className="timeline-dot" style={{ borderColor: STATUS_COLORS[entry.status] }}>
              <Icon size={14} color={STATUS_COLORS[entry.status]} />
            </div>
            <div className="timeline-content">
              <strong>{STATUS_LABELS[entry.status] || entry.status}</strong>
              <span>{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    axios.get('/api/orders')
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="page orders-page">
      <Helmet>
        <title>My Orders - Nebula</title>
        <meta name="description" content="View your order history with tracking." />
      </Helmet>

      <div className="page-header">
        <h1>My Orders</h1>
        <p>View your order history and track status</p>
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
          {orders.map(order => {
            const Icon = STATUS_ICONS[order.status] || FiClock;
            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-id">Order #{order.id.slice(-8).toUpperCase()}</div>
                  <span className={`order-status status-${order.status}`}>
                    <Icon size={14} /> {order.status}
                  </span>
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
                  {order.discount > 0 && <span className="order-discount">Saved ₹{formatINR(order.discount)}</span>}
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <button className="btn-text toggle-timeline" onClick={() => toggleExpand(order.id)} aria-label="Toggle tracking">
                    {expanded[order.id] ? <><FiChevronUp /> Hide Tracking</> : <><FiChevronDown /> Show Tracking</>}
                  </button>
                </div>
                {expanded[order.id] && (
                  <div className="order-timeline-wrap">
                    <Timeline timeline={order.timeline} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
