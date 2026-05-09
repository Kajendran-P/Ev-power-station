const SosRequest = require('../models/SosRequest');
const User = require('../models/User');

// @desc    Get technician's active jobs
// @route   GET /api/tech/jobs
exports.getActiveJobs = async (req, res) => {
  try {
    const jobs = await SosRequest.find({
      technicianId: req.user._id.toString(),
      status: { $nin: ['completed', 'cancelled'] }
    }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technician's completed jobs
// @route   GET /api/tech/history
exports.getHistory = async (req, res) => {
  try {
    const jobs = await SosRequest.find({
      technicianId: req.user._id.toString(),
      status: 'completed'
    }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technician stats
// @route   GET /api/tech/stats
exports.getStats = async (req, res) => {
  try {
    const techId = req.user._id.toString();
    const allJobs = await SosRequest.find({ technicianId: techId });
    const pending = allJobs.filter(j => !['completed', 'cancelled'].includes(j.status)).length;
    const completed = allJobs.filter(j => j.status === 'completed').length;
    const totalEarnings = allJobs
      .filter(j => j.status === 'completed' && j.completionReport)
      .reduce((sum, j) => sum + (j.completionReport.cost || 0), 0);

    res.json({
      success: true,
      stats: {
        totalJobs: allJobs.length,
        pending,
        completed,
        earnings: totalEarnings + (req.user.walletBalance || 0),
        rating: 4.7
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update technician online status
// @route   PUT /api/tech/status
exports.updateStatus = async (req, res) => {
  try {
    const { online } = req.body;
    // In a real app, this would update a "status" field
    res.json({ success: true, online });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete a job with service report
// @route   POST /api/tech/complete
exports.completeJob = async (req, res) => {
  try {
    const { sosId, report, otp } = req.body;
    if (otp !== '9999') {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    const sos = await SosRequest.findOne({ sosId });
    if (!sos) return res.status(404).json({ message: 'SOS not found' });

    sos.status = 'completed';
    sos.completionReport = {
      problem: report.problem || 'Issue resolved',
      fix: report.fix || 'Repaired',
      parts: report.parts || '',
      cost: report.cost || 0
    };
    sos.updatedAt = Date.now();
    await sos.save();

    // Update technician earnings
    const tech = await User.findById(req.user._id);
    if (tech) {
      tech.walletBalance = (tech.walletBalance || 0) + (report.cost || 0);
      await tech.save();
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('sos:updated', sos);
    }

    res.json({ success: true, sos, earned: report.cost || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all technicians (for login select)
// @route   GET /api/tech/list
exports.getTechList = async (req, res) => {
  try {
    const techs = await User.find({ role: 'technician' }).select('name phone email location walletBalance');
    res.json({ success: true, technicians: techs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
