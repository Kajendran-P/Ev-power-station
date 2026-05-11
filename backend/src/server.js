const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

const app = express();

// Trust proxy (required for Vercel)
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ev-power-station-iori.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// Security & parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// =============================================================
// CRITICAL MIDDLEWARE: await DB connection on EVERY request
// This ensures mongoose is connected before any route handler
// =============================================================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ DB connection middleware failed:', error.message);
    return res.status(503).json({ message: 'Database unavailable. Please retry.' });
  }
});

// Root
app.get('/', (req, res) => res.json({ message: 'VoltReserve Backend API is running', version: '2.0.0' }));
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/tech', require('./routes/techRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/services', require('./routes/serviceRoutes2'));
app.use('/api/service-requests', require('./routes/serviceRequestRoutes'));
app.use('/api/spare-parts', require('./routes/sparePartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    dbState: mongoose.connection.readyState
  });
});

// Error handler
app.use(errorHandler);

// Local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    const { seedDB } = require('./config/seed');
    seedDB().catch(console.error);
    app.listen(PORT, () => console.log(`⚡ VoltReserve running on port ${PORT}`));
  });
}

module.exports = app;
