require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const razorpayRoutes = require('./routes/razorpay');
const cartRoutes = require('./routes/cart');
const socialRoutes = require('./routes/social');
const authRoutes = require('./routes/auth');
const couponRoutes = require('./routes/coupons');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', isProduction ? 2 : 1);
app.set('etag', 'strong');
app.set('query parser', 'simple');
app.disable('x-powered-by');

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(compression({ level: 6, threshold: 1024 }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.use(hpp());

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '8kb' }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') && req.body && typeof req.body === 'object') {
    const s = JSON.stringify(req.body).toLowerCase();
    if (s.includes('$where') || s.includes('$ne') || s.includes('$gt') || s.includes('$regex')) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    if (s.includes('__proto__') || s.includes('constructor') || s.includes('prototype')) {
      return res.status(400).json({ error: 'Invalid input' });
    }
  }
  next();
});

app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    res.status(503).json({ error: 'Request timeout' });
  });
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-store, must-revalidate');
  }
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const authLimiterStrict = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiterStrict);
app.use('/api', apiLimiter);
app.use('/api/orders', sensitiveLimiter);
app.use('/api/cart', sensitiveLimiter);
app.use('/api/admin', sensitiveLimiter);

app.get('/api/health', (req, res) => {
  const cacheAge = isProduction ? 60 : 0;
  res.set('Cache-Control', `public, max-age=${cacheAge}`);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/auth', socialRoutes);
app.use('/api/coupons', couponRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  if (status === 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.stack);
  }
  res.status(status).json({ error: message });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
