const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount: { type: Number, required: true },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  items: [{
    name: String,
    quantity: { type: Number, default: 1 },
    price: Number
  }],
  customerDetails: {
    name: String,
    email: String,
    phone: String
  },
  vehicleDetails: {
    type: { type: String },
    model: { type: String },
    regNumber: { type: String }
  },
  technicianName: { type: String },
  paymentMethod: { type: String, default: 'upi' },
  pdfPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
