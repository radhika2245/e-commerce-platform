const { readJSON, writeJSON } = require('../config/db');

const PRODUCTS_FILE = 'products.json';

function getAll(req, res) {
  let { category, featured, search, sort, brand, minPrice, maxPrice } = req.query;
  let products = readJSON(PRODUCTS_FILE);

  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }
  if (featured === 'true') {
    products = products.filter(p => p.featured);
  }
  if (brand) {
    const brands = brand.split(',').map(b => b.trim().toLowerCase());
    products = products.filter(p => brands.includes(p.brand.toLowerCase()));
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }
  if (minPrice) {
    products = products.filter(p => p.price >= parseInt(minPrice));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= parseInt(maxPrice));
  }

  if (sort) {
    switch (sort) {
      case 'price_asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        products.sort((a, b) => (b.createdAt || '') > (a.createdAt || '') ? 1 : -1);
        break;
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
  }

  const cacheAge = process.env.NODE_ENV === 'production' ? 30 : 0;
  res.set('Cache-Control', `public, max-age=${cacheAge}`);
  res.json(products);
}

function getBrands(req, res) {
  const products = readJSON(PRODUCTS_FILE);
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  res.json(brands);
}

function getById(req, res) {
  const products = readJSON(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
}

function create(req, res) {
  const products = readJSON(PRODUCTS_FILE);
  const { name, description, price, category, image, stock, brand } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  if (typeof name !== 'string' || name.length > 200) {
    return res.status(400).json({ error: 'Name must be a string under 200 characters' });
  }
  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum < 1 || priceNum > 10000000) {
    return res.status(400).json({ error: 'Price must be between 1 and 10,000,000' });
  }
  const stockNum = parseInt(stock) || 0;
  if (stockNum < 0 || stockNum > 99999) {
    return res.status(400).json({ error: 'Stock must be between 0 and 99,999' });
  }

  const product = {
    id: 'p' + Date.now(),
    name: String(name).trim().slice(0, 200),
    description: String(description || '').slice(0, 2000),
    price: priceNum,
    category: String(category || 'general').toLowerCase().slice(0, 50),
    image: String(image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80').slice(0, 500),
    rating: 0,
    stock: stockNum,
    featured: false,
    brand: String(brand || 'Generic').slice(0, 100),
    reviewsCount: 0,
    discount: 0,
  };

  products.push(product);
  writeJSON(PRODUCTS_FILE, products);
  res.status(201).json(product);
}

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'price', 'category', 'image', 'stock', 'brand'];

function update(req, res) {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const updated = { ...products[idx], id: products[idx].id };
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (req.body[field] !== undefined) {
      updated[field] = req.body[field];
    }
  }
  if (typeof updated.price === 'string') updated.price = parseFloat(updated.price) || 0;
  if (typeof updated.stock === 'string') updated.stock = parseInt(updated.stock) || 0;
  products[idx] = updated;
  writeJSON(PRODUCTS_FILE, products);
  res.json(updated);
}

function remove(req, res) {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  products.splice(idx, 1);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ message: 'Product deleted' });
}

module.exports = { getAll, getBrands, getById, create, update, remove };
