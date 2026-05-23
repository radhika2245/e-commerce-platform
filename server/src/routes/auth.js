const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/authController');
const addrCtrl = require('../controllers/addressController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/profile', verifyToken, ctrl.getProfile);
router.put('/profile', verifyToken, ctrl.updateProfile);
router.put('/password', verifyToken, ctrl.changePassword);
router.get('/addresses', verifyToken, addrCtrl.getAddresses);
router.post('/addresses', verifyToken, addrCtrl.addAddress);
router.put('/addresses/:id', verifyToken, addrCtrl.updateAddress);
router.delete('/addresses/:id', verifyToken, addrCtrl.deleteAddress);

module.exports = router;
