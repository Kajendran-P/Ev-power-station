const Station = require('../models/Station');

// @desc    Get all stations (with filters)
// @route   GET /api/stations
exports.getStations = async (req, res) => {
  try {
    const { type, price, search } = req.query;
    let query = {};
    if (type && type !== 'all') query.type = type;
    if (price === 'low') query.pricePerKwh = { $lt: 12 };
    else if (price === 'mid') query.pricePerKwh = { $gte: 12, $lte: 18 };
    else if (price === 'high') query.pricePerKwh = { $gt: 18 };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    const stations = await Station.find(query).sort({ distance: 1 });
    res.json({ success: true, stations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single station
// @route   GET /api/stations/:id
exports.getStation = async (req, res) => {
  try {
    const station = await Station.findOne({ stationId: req.params.id });
    if (!station) return res.status(404).json({ message: 'Station not found' });
    res.json({ success: true, station });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create station (admin)
// @route   POST /api/stations
exports.createStation = async (req, res) => {
  try {
    const count = await Station.countDocuments();
    const stationId = 'ST' + String(count + 1).padStart(3, '0');
    const station = await Station.create({
      stationId,
      ...req.body,
      lat: req.body.lat || 9.9250 + Math.random() * 0.08 - 0.04,
      lng: req.body.lng || 78.1150 + Math.random() * 0.08 - 0.04,
      status: 'available',
      reviews: []
    });
    res.status(201).json({ success: true, station });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update station (admin)
// @route   PUT /api/stations/:id
exports.updateStation = async (req, res) => {
  try {
    const station = await Station.findOne({ stationId: req.params.id });
    if (!station) return res.status(404).json({ message: 'Station not found' });
    Object.assign(station, req.body);
    if (req.body.totalSlots) {
      station.availableSlots = Math.min(station.availableSlots, req.body.totalSlots);
    }
    await station.save();
    res.json({ success: true, station });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete station (admin)
// @route   DELETE /api/stations/:id
exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findOneAndDelete({ stationId: req.params.id });
    if (!station) return res.status(404).json({ message: 'Station not found' });
    res.json({ success: true, message: 'Station deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
