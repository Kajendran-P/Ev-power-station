const express = require('express');
const { createPaymentOrder, getMyPayments, getAllPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.get('/my', protect, getMyPayments);
router.get('/', protect, authorize('admin'), getAllPayments);

module.exports = router;
