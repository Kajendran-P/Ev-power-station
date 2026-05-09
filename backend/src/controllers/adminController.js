const User = require('../models/User');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const SosRequest = require('../models/SosRequest');

const DEF_PARTS = [
  {id:'P001',name:'Lithium Battery 48V 30Ah',category:'battery',stock:5,price:25000},
  {id:'P002',name:'BLDC Motor 1000W',category:'motor',stock:3,price:8500},
  {id:'P003',name:'Controller Unit 48V',category:'controller',stock:10,price:3000},
  {id:'P004',name:'Brake Pads Set',category:'mechanical',stock:20,price:450},
  {id:'P005',name:'BMS Module 13S',category:'battery',stock:8,price:1800},
  {id:'P006',name:'DC-DC Converter',category:'controller',stock:4,price:2200},
  {id:'P007',name:'Tyre 90/90-12',category:'mechanical',stock:15,price:1200},
  {id:'P008',name:'Hall Effect Sensor Set',category:'motor',stock:12,price:350}
];


exports.getStats = async (req, res) => {
  try {
    const workers = await User.countDocuments({ role: 'technician' });
    const bookings = await Booking.find();
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const sosCount = await SosRequest.countDocuments();

    res.json({
      success: true,
      stats: {
        activeWorkers: workers,
        totalRevenue,
        totalBookings: bookings.length,
        sosCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all workers
// @route   GET /api/admin/workers
exports.getWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: 'technician' }).select('-passwordHash');
    res.json({ success: true, workers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add worker
// @route   POST /api/admin/workers
exports.addWorker = async (req, res) => {
  try {
    const { name, phone, email, specialization } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Fill all fields' });
    }
    const worker = await User.create({
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s/g, '')}@voltreserve.com`,
      passwordHash: 'tech123',
      role: 'technician',
      walletBalance: 0,
      location: { lat: 9.925 + Math.random() * 0.08 - 0.04, lng: 78.115 + Math.random() * 0.08 - 0.04 }
    });
    res.status(201).json({ success: true, worker });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete worker
// @route   DELETE /api/admin/workers/:id
exports.deleteWorker = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Worker removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get parts inventory
// @route   GET /api/admin/parts
exports.getParts = async (req, res) => {
  try {
    res.json({ success: true, parts: DEF_PARTS });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chart data
// @route   GET /api/admin/charts
exports.getChartData = async (req, res) => {
  try {
    const stations = await Station.find();
    const sosRequests = await SosRequest.find();
    const workers = await User.find({ role: 'technician' });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const sosByMonth = [0, 0, 0, 0, 0, 0];
    sosRequests.forEach(r => {
      const m = new Date(r.createdAt).getMonth();
      if (m < 6) sosByMonth[m]++;
    });
    const sosData = sosByMonth.some(v => v > 0) ? sosByMonth : [2, 5, 3, 8, 6, 11];

    res.json({
      success: true,
      charts: {
        revenue: { labels: months, data: [8400, 12200, 9800, 15600, 18200, 22400] },
        usage: {
          labels: stations.map(s => s.name.split(' ')[0]),
          data: stations.map(s => Math.round((s.totalSlots - s.availableSlots) / s.totalSlots * 100))
        },
        sos: { labels: months, data: sosData },
        techPerformance: {
          labels: workers.slice(0, 5).map(w => w.name.split(' ')[0]),
          data: workers.slice(0, 5).map(w => Math.floor((w.walletBalance || 0) / 100))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
