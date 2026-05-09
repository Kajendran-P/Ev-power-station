const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  message: { type: String, required: true },
  type: { type: String, enum: ['general', 'technician-support'], default: 'general' },
  status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
