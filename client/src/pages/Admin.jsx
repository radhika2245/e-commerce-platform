import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiEdit2, FiTrash2, FiPackage, FiDollarSign, FiShoppingBag, FiAlertTriangle } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

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

const CATEGORIES = ['electronics', 'clothing', 'accessories', 'sports', 'home'];

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({ dashboard: true, products: true, orders: true });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', image: '', stock: '', brand: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    axios.get('/api/admin/dashboard')
      .then(r => setDashboard(r.data))
      .catch(() => toast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(prev => ({ ...prev, dashboard: false })));
    axios.get('/api/products')
      .then(r => setProducts(r.data))
      .catch(() => toast('Failed to load products', 'error'))
      .finally(() => setLoading(prev => ({ ...prev, products: false })));
    axios.get('/api/admin/orders')
      .then(r => setOrders(r.data))
      .catch(() => toast('Failed to load orders', 'error'))
      .finally(() => setLoading(prev => ({ ...prev, orders: false })));
  }, []);

  const resetForm = () => setForm({ name: '', description: '', price: '', category: '', image: '', stock: '', brand: '' });

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      category: p.category,
      image: p.image,
      stock: String(p.stock),
      brand: p.brand || '',
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast('Product deleted', 'success');
    } catch {
      toast('Failed to delete product', 'error');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast('Name and price are required', 'error'); return; }
    setSaving(true);
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
    try {
      if (editing) {
        const { data } = await axios.put(`/api/admin/products/${editing}`, payload);
        setProducts(prev => prev.map(p => p.id === editing ? data : p));
        toast('Product updated', 'success');
      } else {
        const { data } = await axios.post('/api/admin/products', payload);
        setProducts(prev => [data, ...prev]);
        toast('Product created', 'success');
      }
      setEditing(null);
      resetForm();
    } catch {
      toast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.put(`/api/admin/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast('Order status updated', 'success');
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  return (
    <div className="page admin-page">
      <Helmet><title>Admin - Nebula</title></Helmet>
      <div className="page-header"><h1>Admin Panel</h1></div>

      <div className="admin-tabs" role="tablist">
        {['dashboard', 'products', 'orders'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} role="tab" aria-selected={tab === t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        loading.dashboard ? (
          <div className="dashboard-grid">
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />)}
          </div>
        ) : dashboard && (
          <div className="dashboard-grid">
            <div className="dashboard-card"><FiPackage aria-hidden="true" /><div><h3>{dashboard.totalProducts}</h3><p>Products</p></div></div>
            <div className="dashboard-card"><FiShoppingBag aria-hidden="true" /><div><h3>{dashboard.totalOrders}</h3><p>Orders</p></div></div>
            <div className="dashboard-card"><FiDollarSign aria-hidden="true" /><div><h3>₹{formatINR(dashboard.totalRevenue)}</h3><p>Revenue</p></div></div>
            <div className="dashboard-card"><FiAlertTriangle aria-hidden="true" /><div><h3>{dashboard.outOfStock}</h3><p>Out of Stock</p></div></div>
          </div>
        )
      )}

      {tab === 'products' && (
        <div className="admin-products">
          <div className="admin-form">
            <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
            <div className="form-grid">
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} aria-label="Product name" />
              <input placeholder="Price (₹)" type="number" step="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} aria-label="Price" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} aria-label="Category" className="form-select">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} aria-label="Stock" />
              <input placeholder="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} aria-label="Brand" />
              <input placeholder="Image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="form-wide" aria-label="Image URL" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-wide" rows={3} aria-label="Description" />
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Product'}
              </button>
              {editing && <button className="btn-secondary" onClick={() => { setEditing(null); resetForm(); }}>Cancel</button>}
            </div>
          </div>

          {loading.products ? (
            <div className="admin-table-skeleton">{['', '', '', ''].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 4, borderRadius: 8 }} />)}</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Stock</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>₹{formatINR(p.price)}</td>
                      <td>{p.category}</td>
                      <td><span className={p.stock === 0 ? 'out' : ''}>{p.stock}</span></td>
                      <td className="action-cell">
                        <button onClick={() => handleEdit(p)} className="icon-btn" aria-label={`Edit ${p.name}`}><FiEdit2 aria-hidden="true" /></button>
                        <button onClick={() => handleDelete(p.id)} className="icon-btn danger" aria-label={`Delete ${p.name}`}><FiTrash2 aria-hidden="true" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        loading.orders ? (
          <div className="admin-table-skeleton">{['', '', ''].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 4, borderRadius: 8 }} />)}</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Customer</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="order-id">{o.id.slice(0, 8)}...</td>
                    <td>{o.items?.length || 0}</td>
                    <td>₹{formatINR(o.total)}</td>
                    <td>
                      <select value={o.status} onChange={e => handleStatus(o.id, e.target.value)} className="status-select" aria-label={`Order ${o.id.slice(0, 8)} status`}>
                        {['confirmed', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>{o.customer?.name || o.userId?.slice(0, 8) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
