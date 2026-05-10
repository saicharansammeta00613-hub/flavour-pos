const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);
require('./socket/socketHandler')(io);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flavour_pos')
  .then(() => {
    console.log('✅ MongoDB Connected successfully');
    // Seed initial data
    require('./utils/seeder').seedInitialData();
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/menu',         require('./routes/menu'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/orders',       require('./routes/orders'));
app.use('/api/tables',       require('./routes/tables'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/kot',          require('./routes/kot'));
app.use('/api/delivery',     require('./routes/delivery'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/expenses',     require('./routes/expenses'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/cash-register',require('./routes/cashRegister'));
app.use('/api/whatsapp',     require('./routes/whatsapp'));
app.use('/api/settings',     require('./routes/settings'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FLAVOUR POS API is running 🍽️',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 FLAVOUR POS Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} is busy, trying ${PORT + 1}...`);
    server.close();
    server.listen(PORT + 1, () => {
      console.log(`\n🚀 FLAVOUR POS Server running on port ${PORT + 1}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT + 1}/api`);
    });
  }
});

module.exports = { app, io };