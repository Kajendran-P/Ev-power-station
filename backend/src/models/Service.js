const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['battery', 'motor', 'controller', 'brake-suspension', 'tyre-wheel', 'charging-port', 'wiring-fuse', 'full-servicing', 'roadside-assistance']
  },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  estimatedTime: { type: String, required: true },
  vehicleTypesSupported: [{
    type: String,
    enum: ['ev-bike', 'ev-car', 'ev-3wheeler', 'ev-bus-truck', 'other']
  }],
  icon: { type: String, default: 'fa-wrench' },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
