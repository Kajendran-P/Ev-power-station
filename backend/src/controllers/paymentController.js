const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ServiceRequest = require('../models/ServiceRequest');

// @desc    Create payment record
// @route   POST /api/payments/create-order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { amount, type, relatedId, paymentMethod } = req.body;
    const payment = await Payment.create({
      customerId: req.user._id,
      amount,
      type,
      relatedId,
      paymentMethod: paymentMethod || 'upi',
      status: 'created'
    });

    // Auto-mark as paid for UPI/cash flows
    if (paymentMethod === 'cash' || paymentMethod === 'upi') {
      payment.status = 'paid';
      await payment.save();

      // Update related entity payment status
      if (type === 'service' && relatedId) {
        await ServiceRequest.findByIdAndUpdate(relatedId, {
          paymentStatus: 'paid',
          paymentId: payment._id
        });
      } else if (type === 'parts' && relatedId) {
        await Order.findByIdAndUpdate(relatedId, {
          paymentStatus: 'paid',
          paymentId: payment._id,
          orderStatus: 'confirmed'
        });
      }
    }

    res.json({
      success: true,
      paymentId: payment._id,
      amount,
      status: payment.status
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: error.message || 'Payment creation failed' });
  }
};

// @desc    Get my payments (customer)
// @route   GET /api/payments/my
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payments (admin)
// @route   GET /api/payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
