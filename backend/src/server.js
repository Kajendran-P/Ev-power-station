const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./utils/socketHandler');
const { seedDB } = require('./config/seed');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket handler
socketHandler(io);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// Serve uploaded files
const uploadsDir = path.join(__dirname, '../uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(path.join(uploadsDir, 'invoices'))) fs.mkdirSync(path.join(uploadsDir, 'invoices'), { recursive: true });
app.use('/uploads', express.static(uploadsDir));

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Error handler
app.use(errorHandler);

// Seed database on first run
seedDB().catch(console.error);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`⚡ VoltReserve Backend running on port ${PORT}`);
});
