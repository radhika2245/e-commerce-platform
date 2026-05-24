const { readJSON, writeJSON } = require('../config/db');

const PRODUCTS_FILE = 'products.json';
const ORDERS_FILE = 'orders.json';

function getDashboard(req, res) {
  const products = readJSON(PRODUCTS_FILE) || [];
  const orders = readJSON(ORDERS_FILE) || [];

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const outOfStock = products.filter(p => p.stock === 0).length;

  res.json({
    totalProducts,
    totalOrders,
    totalRevenue,
    outOfStock,
  });
}

function getOrders(req, res) {
  const orders = readJSON(ORDERS_FILE);
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
}

module.exports = { getDashboard, getOrders };
