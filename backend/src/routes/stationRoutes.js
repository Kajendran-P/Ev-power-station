const express = require('express');
const { getStations, getStation, createStation, updateStation, deleteStation } = require('../controllers/stationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getStations);
router.get('/:id', getStation);
router.post('/', protect, authorize('admin'), createStation);
router.put('/:id', protect, authorize('admin'), updateStation);
router.delete('/:id', protect, authorize('admin'), deleteStation);

module.exports = router;
