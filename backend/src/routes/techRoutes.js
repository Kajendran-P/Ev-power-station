const express = require('express');
const { getActiveJobs, getHistory, getStats, updateStatus, completeJob, getTechList } = require('../controllers/techController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/list', getTechList);
router.get('/jobs', protect, authorize('technician'), getActiveJobs);
router.get('/history', protect, authorize('technician'), getHistory);
router.get('/stats', protect, authorize('technician'), getStats);
router.put('/status', protect, authorize('technician'), updateStatus);
router.post('/complete', protect, authorize('technician'), completeJob);

module.exports = router;
