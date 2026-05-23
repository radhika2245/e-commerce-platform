const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/couponController');

router.post('/validate', ctrl.validateCoupon);
router.post('/:id/use', ctrl.incrementUsage);

module.exports = router;
