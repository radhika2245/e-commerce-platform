const { readJSON, writeJSON } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ORDERS_FILE = 'orders.json';
const PRODUCTS_FILE = 'products.json';
const COUPONS_FILE = 'coupons.json';
const FREE_SHIPPING_THRESHOLD = 4999;
const SHIPPING_COST = 499;

function placeOrder(req, res) {
  const orders = readJSON(ORDERS_FILE);
  const products = readJSON(PRODUCTS_FILE);
  const { items, customer, paymentId, paymentMethod, couponCode } = req.body;

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

  let serverSubtotal = 0;
  const orderItems = [];
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
    
    const discountedPrice = product.discount ? product.price - Math.round(product.price * product.discount / 100) : product.price;
    serverSubtotal += discountedPrice * item.quantity;
    
    orderItems.push({
      id: product.id,
      name: product.name,
      price: discountedPrice,
      quantity: parseInt(item.quantity),
      image: product.image
    });
  }

  // Validate coupon and calculate discount on server
  let serverDiscount = 0;
  if (couponCode) {
    const coupons = readJSON(COUPONS_FILE);
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (coupon && coupon.active && (serverSubtotal >= coupon.minOrder)) {
      serverDiscount = coupon.type === 'percentage' 
        ? Math.round(serverSubtotal * coupon.value / 100) 
        : coupon.value;
      if (coupon.type === 'percentage' && coupon.maxDiscount > 0) {
        serverDiscount = Math.min(serverDiscount, coupon.maxDiscount);
      }
      serverDiscount = Math.min(serverDiscount, serverSubtotal);
    }
  } else {
    serverDiscount = Math.min(Math.max(0, parseFloat(req.body.discount) || 0), serverSubtotal);
  }

  const shipping = serverSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const finalTotal = serverSubtotal + shipping - serverDiscount;

  for (const item of items) {
    const idx = products.findIndex(p => p.id === item.id);
    if (idx !== -1) {
      products[idx].stock -= item.quantity;
    }
  }
  writeJSON(PRODUCTS_FILE, products);

  const now = new Date().toISOString();
  const order = {
    id: uuidv4(),
    items: orderItems,
    customer: { name: String(customer.name), email: String(customer.email), phone: String(customer.phone || ''), address: customer.address || null },
    subtotal: serverSubtotal,
    shipping,
    discount: serverDiscount,
    total: finalTotal,
    couponCode: couponCode ? String(couponCode).slice(0, 50) : null,
    status: 'confirmed',
    userId: req.user ? req.user.id : null,
    paymentId: paymentId ? String(paymentId).slice(0, 200) : null,
    paymentMethod: ['stripe', 'cod'].includes(paymentMethod) ? paymentMethod : null,
    timeline: [{ status: 'confirmed', timestamp: now }],
    createdAt: now,
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

  if (!orders[idx].timeline) orders[idx].timeline = [{ status: 'confirmed', timestamp: orders[idx].createdAt }];
  orders[idx].status = status;
  orders[idx].timeline.push({ status, timestamp: new Date().toISOString() });
  writeJSON(ORDERS_FILE, orders);
  res.json(orders[idx]);
}

module.exports = { placeOrder, getAll, getById, updateStatus };
