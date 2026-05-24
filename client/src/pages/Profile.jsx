import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiUser, FiMail, FiCalendar, FiPackage, FiSave, FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import formatINR from '../utils/formatINR';
import api from '../api/axios';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get('/api/orders')
      .then(res => {
        if (Array.isArray(res.data)) {
          setOrders(res.data.slice(0, 5));
        } else {
          setOrders([]);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const handleUpdateProfile = async e => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/auth/profile', { name });
      toast('Profile updated', 'success');
      const stored = JSON.parse(localStorage.getItem('nebula_user') || '{}');
      stored.name = name;
      localStorage.setItem('nebula_user', JSON.stringify(stored));
      setName(name);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast('Fill in both password fields', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/auth/password', { currentPassword, newPassword });
      toast('Password changed', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast('Signed out', 'info');
  };

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <FiUser size={48} />
          <h3>Please sign in</h3>
          <p>Sign in to view your profile.</p>
          <Link to="/login" className="btn-primary" style={{ marginTop: 16 }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <Helmet>
        <title>My Profile - Radhika</title>
        <meta name="description" content="Manage your profile, password, and orders." />
      </Helmet>

      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="profile-avatar-img" />
            ) : (
              <FiUser size={32} />
            )}
          </div>
          <h2>{user.name}</h2>
          <span className="profile-email">{user.email}</span>
          <span className="profile-joined">
            <FiCalendar size={13} /> Member
          </span>

          <nav className="profile-nav">
            <a href="#details" className="profile-nav-link active">Account Details</a>
            <a href="#password" className="profile-nav-link">Change Password</a>
            <a href="#orders" className="profile-nav-link">Order History</a>
          </nav>

          <button className="btn-secondary profile-logout" onClick={handleLogout}>
            <FiLogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="profile-main">
          <section id="details" className="profile-section">
            <h3>Account Details</h3>
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="profile-name">Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  disabled
                  className="input-disabled"
                />
                <span className="form-hint">Email cannot be changed</span>
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                <FiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </section>

          <section id="password" className="profile-section">
            <h3>Change Password</h3>
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                <FiSave size={16} /> {saving ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          </section>

          <section id="orders" className="profile-section">
            <div className="profile-section-header">
              <h3>Recent Orders</h3>
              <Link to="/orders" className="section-link">View All <FiPackage size={14} /></Link>
            </div>
            {ordersLoading ? (
              <div className="skeleton-list" style={{ padding: 0 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton-order" style={{ height: 80 }} />)}
              </div>
            ) : !Array.isArray(orders) || orders.length === 0 ? (
              <div className="profile-empty">
                <p>No orders yet.</p>
                <Link to="/products" className="btn-secondary">Start Shopping</Link>
              </div>
            ) : (
              <div className="profile-orders">
                {orders.map(order => (
                  <div key={order.id} className="profile-order">
                    <div className="profile-order-top">
                      <span className="profile-order-id">#{order.id.slice(-8).toUpperCase()}</span>
                      <span className={`order-status status-${order.status}`}>{order.status}</span>
                    </div>
                    <div className="profile-order-bottom">
                      <span className="profile-order-total">₹{formatINR(order.total)}</span>
                      <span className="profile-order-date">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="profile-order-items">{order.items?.length || 0} items</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
