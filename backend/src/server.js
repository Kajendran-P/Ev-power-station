const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { seedDB } = require('./config/seed');

// Load env vars
dotenv.config();

const app = express();

// Trust proxy (required for Vercel + rate limiting)
app.set('trust proxy', 1);

// CORS configuration — explicitly allow your Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://ev-power-station-iori.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    // In production, allow all Vercel preview URLs
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// ========================================================
// CRITICAL: Ensure MongoDB is connected BEFORE any route
// This middleware runs on EVERY request and awaits connectDB()
// ========================================================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ DB middleware connection error:', error.message);
    res.status(503).json({
      message: 'Database connection failed. Please try again.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Serve uploaded files (for local dev — Vercel has read-only fs)
if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(path.join(uploadsDir, 'invoices'))) fs.mkdirSync(path.join(uploadsDir, 'invoices'), { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
}

// Routes
app.get('/', (req, res) => res.json({ message: 'VoltReserve Backend API is running', version: '2.0.0' }));
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/tech', require('./routes/techRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// New service marketplace routes
app.use('/api/services', require('./routes/serviceRoutes2'));
app.use('/api/service-requests', require('./routes/serviceRequestRoutes'));
app.use('/api/spare-parts', require('./routes/sparePartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Health check
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handler
app.use(errorHandler);

// Seed database (non-blocking — runs in background)
connectDB().then(() => {
  seedDB().catch(console.error);
}).catch(console.error);

// For local development: start server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`⚡ VoltReserve Backend running on port ${PORT}`);
  });
}

module.exports = app;
