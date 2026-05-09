const express = require('express');
const { generateInvoice, downloadInvoice, getMyInvoices, getAllInvoices } = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/generate', protect, generateInvoice);
router.get('/my', protect, getMyInvoices);
router.get('/:id/download', protect, downloadInvoice);
router.get('/', protect, authorize('admin'), getAllInvoices);

module.exports = router;
