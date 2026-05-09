const Order = require('../models/Order');
const SparePart = require('../models/SparePart');

// @desc    Create order (customer)
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
    // Validate stock
    for (const item of items) {
      const part = await SparePart.findById(item.partId);
      if (!part || part.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.partName || 'part'}` });
      }
    }

    // Set payment/order status based on method
    const isCOD = paymentMethod === 'cash';
    const order = await Order.create({
      customerId: req.user._id,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'razorpay',
      paymentStatus: isCOD ? 'pending' : 'pending',
      orderStatus: isCOD ? 'confirmed' : 'pending'
    });

    // Reduce stock
    for (const item of items) {
      await SparePart.findByIdAndUpdate(item.partId, { $inc: { stock: -item.quantity } });
    }
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my orders (customer)
// @route   GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
