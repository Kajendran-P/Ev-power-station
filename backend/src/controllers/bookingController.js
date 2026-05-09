const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');

// @desc    Create booking
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const {
      stationId, stationName, vehicleType, slot, date, time,
      duration, chargerType, energy, basePrice, gst, totalAmount,
      userName, userMobile, userEmail, paymentMethod,
      vehicleBrand, vehicleModel, vehicleNumberPlate,
      currentBatteryPercent, targetBatteryPercent, connectorType
    } = req.body;

    // Validate station exists and has available slots
    const station = await Station.findOne({ stationId });
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    if (station.availableSlots <= 0) {
      return res.status(400).json({ message: 'No available slots at this station. Please try another station.' });
    }

    // Validate required fields
    if (!date || !time || !duration || !vehicleType) {
      return res.status(400).json({ message: 'Please fill in all required fields (date, time, duration, vehicle type).' });
    }

    const bookingId = 'VR-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const paymentId = 'PAY-' + Date.now();

    // Server-side price calculation for validation
    const hrs = duration / 60;
    const energyCalc = parseFloat((station.power * hrs).toFixed(1));
    const multiplier = chargerType === 'fast' ? 1.5 : 1.0;
    const basePriceCalc = energyCalc * station.pricePerKwh * multiplier;
    const gstCalc = basePriceCalc * 0.18;
    const totalCalc = basePriceCalc + gstCalc;

    // Generate QR code data
    const qrCodeData = JSON.stringify({
      bookingId,
      userId: req.user._id,
      stationId,
      slot: slot || 'Slot 1',
      date,
      time,
      chargerType: chargerType || 'normal'
    });

    const booking = await Booking.create({
      bookingId,
      userId: req.user._id,
      stationId,
      stationName: stationName || station.name,
      vehicleType,
      vehicleBrand: vehicleBrand || '',
      vehicleModel: vehicleModel || '',
      vehicleNumberPlate: vehicleNumberPlate || '',
      currentBatteryPercent: currentBatteryPercent || 0,
      targetBatteryPercent: targetBatteryPercent || 100,
      connectorType: connectorType || '',
      slot: slot || 'Slot 1',
      date,
      time,
      duration,
      chargerType: chargerType || 'normal',
      energy: energy || energyCalc,
      basePrice: basePrice || basePriceCalc,
      gst: gst || gstCalc,
      totalAmount: totalAmount || totalCalc,
      userName: userName || req.user.name || '',
      userMobile: userMobile || req.user.phone || '',
      userEmail: userEmail || req.user.email || '',
      paymentMethod: paymentMethod || 'card',
      paymentId,
      stationLat: station.lat,
      stationLng: station.lng,
      qrCodeData,
      status: 'upcoming'
    });

    // Update station availability
    station.availableSlots = Math.max(0, station.availableSlots - 1);
    if (station.availableSlots === 0) station.status = 'full';
    else if (station.availableSlots < 3) station.status = 'limited';
    await station.save();

    // Deduct from wallet if wallet payment
    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.user._id);
      if (user) {
        user.walletBalance = Math.max(0, user.walletBalance - (totalAmount || totalCalc));
        await user.save();
      }
    }

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
