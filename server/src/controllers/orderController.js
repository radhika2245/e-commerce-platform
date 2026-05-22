const { readJSON, writeJSON } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ORDERS_FILE = 'orders.json';
const PRODUCTS_FILE = 'products.json';

function placeOrder(req, res) {
  const orders = readJSON(ORDERS_FILE);
  const products = readJSON(PRODUCTS_FILE);
  const { items, customer, paymentId, paymentMethod } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Items are required' });
  }
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }
  if (items.length > 50) {
    return res.status(400).json({ error: 'Too many items' });
  }
  if (!customer || !customer.name || !customer.email) {
    return res.status(400).json({ error: 'Customer name and email are required' });
  }
  if (typeof customer.name !== 'string' || customer.name.length > 200) {
    return res.status(400).json({ error: 'Invalid customer name' });
  }

  let serverTotal = 0;
  for (const item of items) {
    if (!item.id || !item.quantity || item.quantity < 1) {
      return res.status(400).json({ error: 'Each item must have an id and quantity >= 1' });
    }
    if (item.quantity > 99) {
      return res.status(400).json({ error: 'Quantity cannot exceed 99 per item' });
    }
    const product = products.find(p => p.id === item.id);
    if (!product) {
      return res.status(400).json({ error: `Product ${item.id} not found` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    }
    serverTotal += product.price * item.quantity;
  }

  for (const item of items) {
    const idx = products.findIndex(p => p.id === item.id);
    if (idx !== -1) {
      products[idx].stock -= item.quantity;
    }
  }
  writeJSON(PRODUCTS_FILE, products);

  const order = {
    id: uuidv4(),
    items: items.map(i => ({ id: i.id, name: String(i.name || ''), price: Math.max(0, parseFloat(i.price) || 0), quantity: Math.max(1, parseInt(i.quantity) || 1), image: String(i.image || '') })),
    customer: { name: String(customer.name), email: String(customer.email) },
    total: serverTotal,
    status: 'confirmed',
    userId: req.user ? req.user.id : null,
    paymentId: paymentId ? String(paymentId).slice(0, 200) : null,
    paymentMethod: paymentMethod === 'razorpay' || paymentMethod === 'stripe' ? paymentMethod : null,
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  writeJSON(ORDERS_FILE, orders);
  res.status(201).json(order);
}

function getAll(req, res) {
  const orders = readJSON(ORDERS_FILE);
  const userOrders = req.user.role === 'admin'
    ? orders
    : orders.filter(o => o.userId === req.user.id);
  res.json(userOrders);
}

function getById(req, res) {
  const orders = readJSON(ORDERS_FILE);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.user.role !== 'admin' && order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(order);
}

function updateStatus(req, res) {
  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body;
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }
  const orders = readJSON(ORDERS_FILE);
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });

  orders[idx].status = status;
  writeJSON(ORDERS_FILE, orders);
  res.json(orders[idx]);
}

module.exports = { placeOrder, getAll, getById, updateStatus };
