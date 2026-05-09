const nodemailer = require('nodemailer');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const isValidEmail = (email) => typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email);

const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('Missing Gmail SMTP credentials. Set GMAIL_USER and GMAIL_PASS in .env');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
};

// @desc    Send OTP via email
// @route   POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    const now = new Date();

    if (user?.otpSentAt && now - user.otpSentAt < 30 * 1000) {
      return res.status(429).json({ message: 'Please wait 30 seconds before requesting a new OTP' });
    }

    if (!user) {
      user = await User.create({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'customer'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.otpSentAt = now;
    await user.save();

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: normalizedEmail,
      subject: 'Your One-Time Login Code',
      text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
      html: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`
    });

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    const message = error.message?.includes('Missing Gmail SMTP credentials')
      ? error.message
      : 'Failed to send OTP. Please check email settings.';
    res.status(500).json({ message });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Enter the 6-digit OTP' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpSentAt = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Email login using password
// @route   POST /api/auth/login-password
exports.loginPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ message: 'Enter email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = exports.loginPassword;

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !isValidEmail(email) || !password || password.length < 6) {
      return res.status(400).json({ message: 'Fill all fields correctly' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: role || 'customer',
      walletBalance: 500
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone;
    await user.save();
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, walletBalance: user.walletBalance } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add money to wallet
// @route   PUT /api/auth/wallet
exports.addToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) {
      return res.status(400).json({ message: 'Minimum recharge is ₹10' });
    }
    const user = await User.findById(req.user._id);
    user.walletBalance += amount;
    await user.save();
    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
