const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/profile', verifyToken, ctrl.getProfile);
router.put('/profile', verifyToken, ctrl.updateProfile);
router.put('/password', verifyToken, ctrl.changePassword);

module.exports = router;
