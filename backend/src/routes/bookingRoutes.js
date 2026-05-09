const express = require('express');
const { createBooking, getMyBookings, getAllBookings } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/', protect, authorize('admin'), getAllBookings);

module.exports = router;
