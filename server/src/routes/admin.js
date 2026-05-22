const { Router } = require('express');
const router = Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const adminCtrl = require('../controllers/adminController');
const productCtrl = require('../controllers/productController');
const orderCtrl = require('../controllers/orderController');

router.use(verifyToken, requireAdmin);

router.get('/dashboard', adminCtrl.getDashboard);
router.get('/orders', adminCtrl.getOrders);
router.put('/orders/:id/status', orderCtrl.updateStatus);
router.post('/products', productCtrl.create);
router.put('/products/:id', productCtrl.update);
router.delete('/products/:id', productCtrl.remove);

module.exports = router;
