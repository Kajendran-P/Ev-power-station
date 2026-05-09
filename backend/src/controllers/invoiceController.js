const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Invoice = require('../models/Invoice');
const ServiceRequest = require('../models/ServiceRequest');
const Order = require('../models/Order');
const User = require('../models/User');

const uploadsDir = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const generateInvoiceNumber = () => {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;
};

// @desc    Generate invoice for service request or order
// @route   POST /api/invoices/generate
exports.generateInvoice = async (req, res) => {
  try {
    const { serviceRequestId, orderId, paymentMethod } = req.body;
    let items = [], customerDetails = {}, vehicleDetails = {}, techName = '', amount = 0;

    if (serviceRequestId) {
      const sr = await ServiceRequest.findById(serviceRequestId);
      if (!sr) return res.status(404).json({ message: 'Service request not found' });
      items = [{ name: sr.serviceName || 'EV Service', quantity: 1, price: sr.amount || 0 }];
      customerDetails = { name: sr.customerName, email: sr.email, phone: sr.phone };
      vehicleDetails = { type: sr.vehicleType, model: sr.vehicleModel, regNumber: sr.regNumber };
      techName = sr.technicianName || '';
      amount = sr.amount || 0;
    } else if (orderId) {
      const order = await Order.findById(orderId).populate('customerId', 'name email phone');
      if (!order) return res.status(404).json({ message: 'Order not found' });
      items = order.items.map(i => ({ name: i.partName, quantity: i.quantity, price: i.price }));
      customerDetails = { name: order.customerId?.name, email: order.customerId?.email, phone: order.customerId?.phone };
      amount = order.totalAmount;
    }

    const gstRate = 0.18;
    const gstAmount = Math.round(amount * gstRate * 100) / 100;
    const totalAmount = amount + gstAmount;
    const invoiceNumber = generateInvoiceNumber();
    const pdfFileName = `${invoiceNumber}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('KR Charging Power Station', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('EV Service & Spare Parts', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#00F582');
    doc.moveDown();

    // Invoice info
    doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
    doc.text(`Payment Method: ${(paymentMethod || 'UPI').toUpperCase()}`);
    doc.moveDown();

    // Customer details
    doc.fontSize(12).font('Helvetica-Bold').text('Customer Details');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${customerDetails.name || 'N/A'}`);
    doc.text(`Email: ${customerDetails.email || 'N/A'}`);
    doc.text(`Phone: ${customerDetails.phone || 'N/A'}`);
    doc.moveDown();

    // Vehicle details (if service)
    if (vehicleDetails.type) {
      doc.fontSize(12).font('Helvetica-Bold').text('Vehicle Details');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Type: ${vehicleDetails.type}`);
      doc.text(`Model: ${vehicleDetails.model}`);
      doc.text(`Reg. Number: ${vehicleDetails.regNumber}`);
      if (techName) doc.text(`Technician: ${techName}`);
      doc.moveDown();
    }

    // Items table
    doc.fontSize(12).font('Helvetica-Bold').text('Items');
    doc.moveDown(0.5);
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item', 50, tableTop); doc.text('Qty', 350, tableTop); doc.text('Price', 420, tableTop); doc.text('Total', 490, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke('#ccc');
    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(9);
    items.forEach(item => {
      doc.text(item.name || '-', 50, y); doc.text(String(item.quantity || 1), 350, y); doc.text(`₹${item.price}`, 420, y); doc.text(`₹${(item.price * (item.quantity || 1))}`, 490, y);
      y += 18;
    });
    doc.moveTo(50, y).lineTo(545, y).stroke('#ccc');
    y += 10;

    // Totals
    doc.fontSize(10).font('Helvetica');
    doc.text(`Subtotal: ₹${amount}`, 400, y); y += 16;
    doc.text(`GST (18%): ₹${gstAmount}`, 400, y); y += 16;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total: ₹${totalAmount}`, 400, y); y += 30;

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#888');
    doc.text('Thank you for choosing KR Charging Power Station!', 50, y, { align: 'center' });
    doc.text('This is a computer-generated invoice.', { align: 'center' });

    doc.end();

    await new Promise(resolve => writeStream.on('finish', resolve));

    const invoice = await Invoice.create({
      invoiceNumber,
      customerId: req.user._id,
      serviceRequestId,
      orderId,
      amount,
      gstAmount,
      totalAmount,
      items,
      customerDetails,
      vehicleDetails,
      technicianName: techName,
      paymentMethod: paymentMethod || 'upi',
      pdfPath: `/uploads/invoices/${pdfFileName}`
    });

    // Link invoice to service request or order
    if (serviceRequestId) {
      await ServiceRequest.findByIdAndUpdate(serviceRequestId, { invoiceId: invoice._id });
    }
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { invoiceId: invoice._id });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download invoice PDF
// @route   GET /api/invoices/:id/download
exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const filePath = path.join(__dirname, '../../', invoice.pdfPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'PDF file not found' });
    res.download(filePath, `${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my invoices (customer)
// @route   GET /api/invoices/my
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all invoices (admin)
// @route   GET /api/invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
