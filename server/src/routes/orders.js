const { Router } = require('express');
const router = Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET;
      req.user = jwt.verify(header.split(' ')[1], secret);
    } catch {}
  }
  next();
}

router.post('/', optionalAuth, ctrl.placeOrder);
router.get('/', verifyToken, ctrl.getAll);
router.get('/:id', verifyToken, ctrl.getById);

module.exports = router;
