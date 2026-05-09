const SosRequest = require('../models/SosRequest');
const User = require('../models/User');

// @desc    Create SOS request
// @route   POST /api/sos
exports.createSos = async (req, res) => {
  try {
    const { issueType, description, location, locationText } = req.body;
    const sosId = 'SOS-' + Date.now().toString(36).toUpperCase();
    const sos = await SosRequest.create({
      sosId,
      customerId: req.user._id,
      customerName: req.user.name,
      issueType,
      description: description || '',
      location,
      locationText: locationText || '',
      status: 'requested'
    });
    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('sos:new', sos);
    }
    res.status(201).json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active SOS for current user
// @route   GET /api/sos/active
exports.getActiveSos = async (req, res) => {
  try {
    const sos = await SosRequest.findOne({
      customerId: req.user._id,
      status: { $nin: ['completed', 'cancelled'] }
    }).sort({ createdAt: -1 });
    res.json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my SOS history
// @route   GET /api/sos/my
exports.getMySos = async (req, res) => {
  try {
    const requests = await SosRequest.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all SOS (admin)
// @route   GET /api/sos
exports.getAllSos = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { sosId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { technicianName: { $regex: search, $options: 'i' } },
        { issueType: { $regex: search, $options: 'i' } },
        { locationText: { $regex: search, $options: 'i' } }
      ];
    }
    const requests = await SosRequest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get SOS by ID
// @route   GET /api/sos/:id
exports.getSosById = async (req, res) => {
  try {
    const sos = await SosRequest.findOne({ sosId: req.params.id });
    if (!sos) return res.status(404).json({ message: 'SOS request not found' });
    res.json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update SOS
// @route   PUT /api/sos/:id
exports.updateSos = async (req, res) => {
  try {
    const sos = await SosRequest.findOne({ sosId: req.params.id });
    if (!sos) return res.status(404).json({ message: 'SOS request not found' });
    Object.assign(sos, req.body);
    sos.updatedAt = Date.now();
    await sos.save();
    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('sos:updated', sos);
    }
    res.json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auto-assign nearest technician
// @route   PUT /api/sos/:id/assign
exports.autoAssign = async (req, res) => {
  try {
    const sos = await SosRequest.findOne({ sosId: req.params.id });
    if (!sos) return res.status(404).json({ message: 'SOS not found' });
    if (sos.status !== 'requested') return res.status(400).json({ message: 'SOS already assigned' });

    // Find available technicians
    const techs = await User.find({ role: 'technician' });
    if (!techs.length) return res.status(400).json({ message: 'No technicians available' });

    // Find nearest
    const nearest = techs.reduce((a, b) => {
      const da = Math.hypot((a.location?.lat || 0) - sos.location.lat, (a.location?.lng || 0) - sos.location.lng);
      const db = Math.hypot((b.location?.lat || 0) - sos.location.lat, (b.location?.lng || 0) - sos.location.lng);
      return da < db ? a : b;
    });

    sos.status = 'assigned';
    sos.technicianId = nearest._id.toString();
    sos.technicianName = nearest.name;
    sos.techLat = nearest.location?.lat || 9.925;
    sos.techLng = nearest.location?.lng || 78.115;
    sos.updatedAt = Date.now();
    await sos.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('sos:updated', sos);
    }
    res.json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete SOS (admin)
// @route   DELETE /api/sos/:id
exports.deleteSos = async (req, res) => {
  try {
    const sos = await SosRequest.findOneAndDelete({ sosId: req.params.id });
    if (!sos) return res.status(404).json({ message: 'SOS not found' });
    res.json({ success: true, message: 'SOS deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
