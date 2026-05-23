const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { readJSON } = require('../config/db');

const PRODUCTS_FILE = 'products.json';
const FREE_SHIPPING_THRESHOLD = 4999;
const SHIPPING_COST = 499;

async function createPaymentIntent(req, res) {
  try {
    const { items, currency = 'inr' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const products = readJSON(PRODUCTS_FILE);
    let total = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.id} not found` });
      }
      total += product.price * (item.quantity || 1);
    }

    // Add shipping
    if (total < FREE_SHIPPING_THRESHOLD) {
      total += SHIPPING_COST;
    }

    // Handle discount if any (optional, but good to have if we send discount from client)
    // For now, let's keep it simple or allow discount if validated.
    // However, it's safer to not allow client to send final amount.
    const discount = Math.max(0, parseFloat(req.body.discount) || 0);
    const finalAmount = Math.max(1, total - discount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment processing error' });
  }
}

module.exports = { createPaymentIntent };
