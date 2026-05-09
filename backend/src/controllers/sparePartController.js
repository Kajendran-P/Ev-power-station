const SparePart = require('../models/SparePart');

// @desc    Get all spare parts
// @route   GET /api/spare-parts
exports.getSpareParts = async (req, res) => {
  try {
    const { vehicleType, category, search } = req.query;
    let filter = { isActive: true };
    if (vehicleType && vehicleType !== 'all') filter.vehicleTypesSupported = vehicleType;
    if (category && category !== 'all') filter.category = category;
    if (search) filter.partName = { $regex: search, $options: 'i' };
    const parts = await SparePart.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, parts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single spare part
// @route   GET /api/spare-parts/:id
exports.getSparePart = async (req, res) => {
  try {
    const part = await SparePart.findById(req.params.id);
    if (!part) return res.status(404).json({ message: 'Part not found' });
    res.json({ success: true, part });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create spare part (admin)
// @route   POST /api/spare-parts
exports.createSparePart = async (req, res) => {
  try {
    if (req.file) req.body.image = '/uploads/' + req.file.filename;
    const part = await SparePart.create(req.body);
    res.status(201).json({ success: true, part });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update spare part (admin)
// @route   PUT /api/spare-parts/:id
exports.updateSparePart = async (req, res) => {
  try {
    if (req.file) req.body.image = '/uploads/' + req.file.filename;
    const part = await SparePart.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!part) return res.status(404).json({ message: 'Part not found' });
    res.json({ success: true, part });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete spare part (admin)
// @route   DELETE /api/spare-parts/:id
exports.deleteSparePart = async (req, res) => {
  try {
    await SparePart.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Part deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all spare parts (admin - include inactive)
// @route   GET /api/spare-parts/admin/all
exports.getAllPartsAdmin = async (req, res) => {
  try {
    const parts = await SparePart.find().sort({ createdAt: -1 });
    res.json({ success: true, parts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
