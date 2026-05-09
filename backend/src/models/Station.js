const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['fast-dc', 'normal-ac', 'bike'], required: true },
  typeName: { type: String, required: true },
  location: { type: String, required: true },
  address: { type: String, default: '' },
  city: { type: String, default: 'Madurai' },
  area: { type: String, default: '' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  distance: { type: Number, default: 0 },
  totalSlots: { type: Number, required: true },
  availableSlots: { type: Number, required: true },
  power: { type: Number, required: true },
  pricePerKwh: { type: Number, required: true },
  rating: { type: Number, default: 4.5 },
  status: { type: String, enum: ['available', 'limited', 'full'], default: 'available' },
  contact: { type: String, default: '' },
  workingHours: { type: String, default: '06:00 AM - 11:00 PM' },
  chargerTypes: { type: [String], default: ['fast', 'normal'] },
  reviews: [{
    name: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Station', stationSchema);
