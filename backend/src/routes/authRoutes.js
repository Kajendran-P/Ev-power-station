const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, loginPassword, login, register, getMe, updateProfile, addToWallet } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login-password', loginPassword);
router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/wallet', protect, addToWallet);

module.exports = router;
