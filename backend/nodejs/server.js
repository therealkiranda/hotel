// ============================================================
// Grand Lumière Hotel — Node.js / Express REST API v2
// New routes: /api/ota, /api/hr, /api/payments
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
const path = require('path');

// Route modules
const authRoutes     = require('./src/routes/auth');
const roomRoutes     = require('./src/routes/rooms');
const bookingRoutes  = require('./src/routes/bookings');
const userRoutes     = require('./src/routes/users');
const adminRoutes    = require('./src/routes/admin');
const publicRoutes   = require('./src/routes/public');
const otaRoutes      = require('./src/routes/ota');
const hrRoutes       = require('./src/routes/hr');
const paymentRoutes  = require('./src/routes/payments');

const { errorHandler } = require('./src/middleware/errorHandler');
const mediaRoutes        = require('./src/routes/media');
const roomCategoryRoutes = require('./src/routes/roomCategories');
const pagesRoutes        = require('./src/routes/pages');
const frontdeskRoutes    = require('./src/routes/frontdesk');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust CloudPanel's nginx reverse proxy
app.set('trust proxy', 1);

// ─── Database Pool ───────────────────────────────────────────
const pool = mysql.createPool({
  host:             process.env.DB_HOST || 'localhost',
  port:             parseInt(process.env.DB_PORT || 3306),
  user:             process.env.DB_USER || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME || 'hotel_db',
  waitForConnections: true,
  connectionLimit:  20,
  queueLimit:       0,
  charset:          'utf8mb4',
});

app.locals.db = pool;

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
      .split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin) || allowed.includes('*')) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── Rate Limiting ───────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path.startsWith('/api/ota/webhook'), // OTA webhooks exempt
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many auth attempts, please try again later.' },
});

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Static Files (uploads) ──────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// ─── Health Check ────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      version: '2.0.0',
      features: ['bookings', 'ota_sync', 'hr_module', 'qr_payments', 'media_uploads', 'room_categories'],
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ota', otaRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/room-categories', roomCategoryRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/frontdesk', frontdeskRoutes);

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏨  Grand Lumière Hotel API v2.0`);
  console.log(`🚀  Running on port ${PORT}`);
  console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📦  Features: Bookings · OTA Sync · HR Module · QR Payments`);
  console.log(`🔑  First login: POST /api/auth/admin/setup\n`);
});

module.exports = app;
