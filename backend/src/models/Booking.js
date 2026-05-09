const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationId: { type: String, required: true },
  stationName: { type: String, required: true },
  vehicleType: { type: String, enum: ['car', 'bike', 'auto', 'commercial'], required: true },
  vehicleBrand: { type: String, default: '' },
  vehicleModel: { type: String, default: '' },
  vehicleNumberPlate: { type: String, default: '' },
  currentBatteryPercent: { type: Number, default: 0 },
  targetBatteryPercent: { type: Number, default: 100 },
  connectorType: { type: String, default: '' },
  slot: { type: String, default: 'Slot 1' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  chargerType: { type: String, enum: ['fast', 'normal'], default: 'normal' },
  energy: { type: Number, default: 0 },
  basePrice: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  userName: { type: String, default: '' },
  userMobile: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  paymentMethod: { type: String, enum: ['upi', 'card', 'cash', 'wallet'], default: 'card' },
  paymentId: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  stationLat: { type: Number, default: 0 },
  stationLng: { type: Number, default: 0 },
  qrCodeData: { type: String, default: '' },
  invoicePdfPath: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
