const { Router } = require('express');
const router = Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

router.post('/', verifyToken, ctrl.placeOrder);
router.get('/', verifyToken, ctrl.getAll);
router.get('/:id', verifyToken, ctrl.getById);

module.exports = router;
