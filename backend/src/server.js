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

// ── Routes that do NOT need database ──
app.get('/', (req, res) => res.json({
  message: 'VoltReserve Backend API is running',
  version: '2.0.0',
  mongoUri: process.env.MONGO_URI ? 'SET' : 'NOT SET',
  nodeEnv: process.env.NODE_ENV || 'not set'
}));
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));

// Health check (no DB required)
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    dbState: mongoose.connection.readyState,
    envCheck: {
      MONGO_URI: process.env.MONGO_URI ? 'SET (' + process.env.MONGO_URI.substring(0, 30) + '...)' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      FRONTEND_URL: process.env.FRONTEND_URL || 'MISSING'
    }
  });
});

// Debug DB connection (shows actual error)
app.get('/api/debug-db', async (req, res) => {
  try {
    await connectDB();
    const mongoose = require('mongoose');
    res.json({
      success: true,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      dbName: mongoose.connection.name
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      mongoUri: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'NOT SET'
    });
  }
});

// ══════════════════════════════════════════════════════════
// DB MIDDLEWARE: Every /api/* route below this AWAITS DB
// ══════════════════════════════════════════════════════════
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ DB middleware error:', error.message);
    return res.status(503).json({
      message: 'Database connection failed',
      detail: error.message
    });
  }
});

// ── API Routes (DB guaranteed connected) ──
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
