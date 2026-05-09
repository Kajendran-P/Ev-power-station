const express = require('express');
const multer = require('multer');
const path = require('path');
const { getSpareParts, getSparePart, createSparePart, updateSparePart, deleteSparePart, getAllPartsAdmin } = require('../controllers/sparePartController');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `part-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get('/', getSpareParts);
router.get('/admin/all', protect, authorize('admin'), getAllPartsAdmin);
router.get('/:id', getSparePart);
router.post('/', protect, authorize('admin'), upload.single('image'), createSparePart);
router.put('/:id', protect, authorize('admin'), upload.single('image'), updateSparePart);
router.delete('/:id', protect, authorize('admin'), deleteSparePart);

module.exports = router;
