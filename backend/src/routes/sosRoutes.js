const express = require('express');
const { createSos, getActiveSos, getMySos, getAllSos, getSosById, updateSos, autoAssign, deleteSos } = require('../controllers/sosController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createSos);
router.get('/active', protect, getActiveSos);
router.get('/my', protect, getMySos);
router.get('/', protect, getAllSos);
router.get('/:id', protect, getSosById);
router.put('/:id', protect, updateSos);
router.put('/:id/assign', protect, autoAssign);
router.delete('/:id', protect, authorize('admin'), deleteSos);

module.exports = router;
