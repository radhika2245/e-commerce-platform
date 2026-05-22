const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/paymentController');

router.post('/create-payment-intent', ctrl.createPaymentIntent);

module.exports = router;
