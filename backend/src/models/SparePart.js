const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  partName: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['battery', 'motor', 'controller', 'charging', 'wiring', 'brake', 'tyre', 'sensor', 'display', 'other']
  },
  vehicleTypesSupported: [{
    type: String,
    enum: ['ev-bike', 'ev-car', 'ev-3wheeler', 'ev-bus-truck', 'other']
  }],
  price: { type: Number, required: true },
  image: { type: String },
  stock: { type: Number, default: 0 },
  warranty: { type: String, default: '' },
  discount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SparePart', sparePartSchema);
