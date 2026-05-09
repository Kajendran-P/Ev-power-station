const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

// @desc    Submit service request (customer)
// @route   POST /api/service-requests
exports.createServiceRequest = async (req, res) => {
  try {
    const data = {
      ...req.body,
      customerId: req.user._id
    };
    if (req.file) data.uploadedImage = '/uploads/' + req.file.filename;
    const sr = await ServiceRequest.create(data);
    res.status(201).json({ success: true, serviceRequest: sr });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my service requests (customer)
// @route   GET /api/service-requests/my
exports.getMyServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ customerId: req.user._id })
      .populate('serviceId', 'name category price')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all service requests (admin)
// @route   GET /api/service-requests
exports.getAllServiceRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { regNumber: { $regex: search, $options: 'i' } },
        { vehicleModel: { $regex: search, $options: 'i' } }
      ];
    }
    const requests = await ServiceRequest.find(filter)
      .populate('serviceId', 'name category price')
      .populate('technicianId', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service request status (admin/tech)
// @route   PUT /api/service-requests/:id
exports.updateServiceRequest = async (req, res) => {
  try {
    const sr = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    res.json({ success: true, serviceRequest: sr });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign technician to service request (admin)
// @route   PUT /api/service-requests/:id/assign
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const tech = await User.findById(technicianId);
    if (!tech || tech.role !== 'technician') return res.status(400).json({ message: 'Invalid technician' });
    const sr = await ServiceRequest.findByIdAndUpdate(req.params.id, {
      technicianId,
      technicianName: tech.name,
      status: 'confirmed'
    }, { new: true });
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    res.json({ success: true, serviceRequest: sr });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rate service (customer)
// @route   PUT /api/service-requests/:id/rate
exports.rateService = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const sr = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user._id },
      { rating, feedback },
      { new: true }
    );
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    res.json({ success: true, serviceRequest: sr });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get service requests for technician
// @route   GET /api/service-requests/technician
exports.getTechnicianRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ technicianId: req.user._id })
      .populate('serviceId', 'name category price')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
