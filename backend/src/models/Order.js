const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    partId: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart' },
    partName: String,
    quantity: { type: Number, default: 1 },
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['upi', 'cash'], default: 'upi' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  orderStatus: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  shippingAddress: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
