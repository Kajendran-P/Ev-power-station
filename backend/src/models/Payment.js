const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { type: String, enum: ['upi', 'cash'], default: 'upi' },
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
  type: { type: String, enum: ['service', 'parts'], required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
