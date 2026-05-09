const express = require('express');
const { createMessage, getAllMessages, updateMessage } = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', createMessage);
router.get('/', protect, authorize('admin'), getAllMessages);
router.put('/:id', protect, authorize('admin'), updateMessage);

module.exports = router;
