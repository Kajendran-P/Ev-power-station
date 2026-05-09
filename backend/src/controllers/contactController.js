const ContactMessage = require('../models/ContactMessage');

// @desc    Submit contact message (public)
// @route   POST /api/contact
exports.createMessage = async (req, res) => {
  try {
    const { name, email, phone, message, type } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }
    const msg = await ContactMessage.create({ name, email, phone, message, type });
    res.status(201).json({ success: true, message: 'Message sent successfully', contactMessage: msg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages (admin)
// @route   GET /api/contact
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update message status (admin)
// @route   PUT /api/contact/:id
exports.updateMessage = async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json({ success: true, contactMessage: msg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
