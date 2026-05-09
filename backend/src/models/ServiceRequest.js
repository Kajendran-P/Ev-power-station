const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  serviceName: { type: String, default: '' },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  vehicleType: {
    type: String,
    enum: ['ev-bike', 'ev-car', 'ev-3wheeler', 'ev-bus-truck', 'other'],
    required: true
  },
  vehicleModel: { type: String, required: true },
  regNumber: { type: String, required: true },
  issueDescription: { type: String, required: true },
  preferredDate: { type: String, required: true },
  preferredSlot: { type: String, required: true },
  pickupRequired: { type: Boolean, default: false },
  serviceLocation: { type: String, enum: ['station', 'home'], default: 'station' },
  uploadedImage: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianName: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  technicianNotes: { type: String },
  estimatedCompletion: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
