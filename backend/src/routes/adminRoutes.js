const express = require('express');
const { getStats, getWorkers, addWorker, deleteWorker, getParts, getChartData } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/workers', protect, authorize('admin'), getWorkers);
router.post('/workers', protect, authorize('admin'), addWorker);
router.delete('/workers/:id', protect, authorize('admin'), deleteWorker);
router.get('/parts', protect, authorize('admin'), getParts);
router.get('/charts', protect, authorize('admin'), getChartData);

module.exports = router;
