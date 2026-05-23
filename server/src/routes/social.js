const { Router } = require('express');
const router = Router();
const { googleLogin } = require('../controllers/googleAuthController');

router.post('/google', googleLogin);

module.exports = router;
