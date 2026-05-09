const Service = require('../models/Service');

// @desc    Get all services (with optional vehicle type filter)
// @route   GET /api/services
exports.getServices = async (req, res) => {
  try {
    const { vehicleType, category, search } = req.query;
    let filter = { isActive: true };
    if (vehicleType && vehicleType !== 'all') filter.vehicleTypesSupported = vehicleType;
    if (category && category !== 'all') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const services = await Service.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create service (admin)
// @route   POST /api/services
exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service (admin)
// @route   PUT /api/services/:id
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete service (admin)
// @route   DELETE /api/services/:id
exports.deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
