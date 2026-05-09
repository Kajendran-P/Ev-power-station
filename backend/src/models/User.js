const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String },
  otp: { type: String, trim: true },
  otpExpiry: { type: Date },
  otpSentAt: { type: Date },
  role: { type: String, enum: ['customer', 'technician', 'admin'], default: 'customer' },
  walletBalance: { type: Number, default: 500 },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  vehicleDetails: {
    type: { type: String, default: '' },
    model: { type: String, default: '' },
    regNumber: { type: String, default: '' }
  },
  address: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  if (this.passwordHash.startsWith('$2')) return next(); // already hashed
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
