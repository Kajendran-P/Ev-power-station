const express = require('express');
const multer = require('multer');
const path = require('path');
const { createServiceRequest, getMyServiceRequests, getAllServiceRequests, updateServiceRequest, assignTechnician, rateService, getTechnicianRequests } = require('../controllers/serviceRequestController');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `sr-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.post('/', protect, upload.single('vehicleImage'), createServiceRequest);
router.get('/my', protect, getMyServiceRequests);
router.get('/technician', protect, authorize('technician'), getTechnicianRequests);
router.get('/', protect, authorize('admin'), getAllServiceRequests);
router.put('/:id', protect, authorize('admin', 'technician'), updateServiceRequest);
router.put('/:id/assign', protect, authorize('admin'), assignTechnician);
router.put('/:id/rate', protect, rateService);

module.exports = router;
