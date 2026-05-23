const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder(req, res) {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: 'rcpt_' + Date.now(),
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay error:', err.message);
    res.status(500).json({ error: 'Payment order creation failed' });
  }
}

async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const crypto = require('crypto');

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSign === razorpay_signature) {
      res.json({ status: 'ok', message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ status: 'failed', message: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Razorpay verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
}

module.exports = { createOrder, verifyPayment };
