const express = require('express');
const { createOrder, getMyOrders, getAllOrders, updateOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id', protect, authorize('admin'), updateOrder);

module.exports = router;
