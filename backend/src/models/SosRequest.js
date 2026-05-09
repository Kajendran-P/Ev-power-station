const mongoose = require('mongoose');

const sosRequestSchema = new mongoose.Schema({
  sosId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, default: 'Customer' },
  issueType: { type: String, required: true },
  description: { type: String, default: '' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  locationText: { type: String, default: '' },
  technicianId: { type: String, default: null },
  technicianName: { type: String, default: null },
  status: {
    type: String,
    enum: ['requested', 'assigned', 'accepted', 'on_the_way', 'arrived', 'completed', 'cancelled'],
    default: 'requested'
  },
  techLat: { type: Number, default: null },
  techLng: { type: Number, default: null },
  liveTrackingEnabled: { type: Boolean, default: true },
  completionReport: {
    problem: String,
    fix: String,
    parts: String,
    cost: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

sosRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SosRequest', sosRequestSchema);
