const { Router } = require('express');
const router = Router();
const { verifyToken } = require('../middleware/auth');
const { readJSON, writeJSON } = require('../config/db');

const CARTS_FILE = 'carts.json';

router.get('/', verifyToken, (req, res) => {
  const carts = readJSON(CARTS_FILE);
  const cart = carts.find(c => c.userId === req.user.id);
  res.json(cart ? cart.items : []);
});

router.put('/', verifyToken, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }

  const sanitized = items.map(item => ({
    id: item.id,
    name: String(item.name || ''),
    price: Math.max(0, parseFloat(item.price) || 0),
    quantity: Math.max(1, parseInt(item.quantity) || 1),
    image: String(item.image || ''),
    brand: String(item.brand || ''),
    description: String(item.description || ''),
  }));

  const carts = readJSON(CARTS_FILE);
  const idx = carts.findIndex(c => c.userId === req.user.id);
  if (idx >= 0) {
    carts[idx].items = sanitized;
    carts[idx].updatedAt = new Date().toISOString();
  } else {
    carts.push({
      userId: req.user.id,
      items: sanitized,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  writeJSON(CARTS_FILE, carts);
  res.json(sanitized);
});

module.exports = router;
