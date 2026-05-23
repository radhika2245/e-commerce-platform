const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../config/db');

const COUPONS_FILE = 'coupons.json';

function getAll(req, res) {
  const coupons = readJSON(COUPONS_FILE);
  res.json(coupons);
}

function create(req, res) {
  const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt } = req.body;
  if (!code || !type || value === undefined) {
    return res.status(400).json({ error: 'Code, type, and value are required' });
  }
  if (type !== 'percentage' && type !== 'fixed') {
    return res.status(400).json({ error: 'Type must be "percentage" or "fixed"' });
  }
  const coupons = readJSON(COUPONS_FILE);
  const existing = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(409).json({ error: 'Coupon code already exists' });
  }
  const coupon = {
    id: uuidv4(),
    code: String(code).toUpperCase().trim().slice(0, 50),
    type,
    value: Math.max(0, parseFloat(value) || 0),
    minOrder: Math.max(0, parseFloat(minOrder) || 0),
    maxDiscount: type === 'percentage' ? Math.max(0, parseFloat(maxDiscount) || 0) : 0,
    usageLimit: Math.max(0, parseInt(usageLimit) || 0),
    usedCount: 0,
    expiresAt: expiresAt || null,
    active: true,
    createdAt: new Date().toISOString(),
  };
  coupons.push(coupon);
  writeJSON(COUPONS_FILE, coupons);
  res.status(201).json(coupon);
}

function update(req, res) {
  const coupons = readJSON(COUPONS_FILE);
  const idx = coupons.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Coupon not found' });
  const allowed = ['value', 'minOrder', 'maxDiscount', 'usageLimit', 'expiresAt', 'active'];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      coupons[idx][field] = req.body[field];
    }
  }
  writeJSON(COUPONS_FILE, coupons);
  res.json(coupons[idx]);
}

function validateCoupon(req, res) {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });
  const coupons = readJSON(COUPONS_FILE);
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
  if (!coupon.active) return res.status(400).json({ error: 'This coupon is no longer active' });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'This coupon has expired' });
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ error: 'This coupon has reached its usage limit' });
  }
  const total = parseFloat(orderTotal) || 0;
  if (total < coupon.minOrder) {
    return res.status(400).json({ error: `Minimum order amount is ₹${coupon.minOrder}` });
  }
  let discount = coupon.type === 'percentage' ? Math.round(total * coupon.value / 100) : coupon.value;
  if (coupon.type === 'percentage' && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, total);
  res.json({ valid: true, discount, coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value, minOrder: coupon.minOrder, maxDiscount: coupon.maxDiscount } });
}

function incrementUsage(req, res) {
  const coupons = readJSON(COUPONS_FILE);
  const idx = coupons.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Coupon not found' });
  coupons[idx].usedCount = (coupons[idx].usedCount || 0) + 1;
  writeJSON(COUPONS_FILE, coupons);
  res.json(coupons[idx]);
}

module.exports = { getAll, create, update, validateCoupon, incrementUsage };
