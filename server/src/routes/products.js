const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/productController');

router.get('/', ctrl.getAll);
router.get('/brands', ctrl.getBrands);
router.get('/:id', ctrl.getById);

module.exports = router;
