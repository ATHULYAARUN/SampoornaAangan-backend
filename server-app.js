const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const passwordResetRoutes = require('./routes/passwordReset');
const registrationRoutes = require('./routes/registration');
const reportsRoutes = require('./routes/reports');
const attendanceRoutes = require('./routes/attendance');
const attendanceTestRoutes = require('./routes/attendance-test');
const healthRoutes = require('./routes/health');
const systemSettingsRoutes = require('./routes/systemSettings');
const schemesRoutes = require('./routes/schemes-simple');
const feedbackRoutes = require('./routes/feedback');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { initializeFirebase } = require('./config/firebase');

const app = express();

// Initialize Firebase Admin (safe to no-op in serverless)
try {
  initializeFirebase();
} catch (error) {
  console.log('Firebase initialization skipped:', error.message);
}

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production'
    ? [
        'https://sampoornaaangan-forntend3.onrender.com',
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176'
      ];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked for origin: ${origin}`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static
app.use('/uploads', express.static('uploads'));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// API routes
try { app.use('/api/auth', authRoutes); } catch (e) { console.log('Auth routes not available'); }
try { app.use('/api/users', userRoutes); } catch (e) { console.log('User routes not available'); }
try { app.use('/api/admin', adminRoutes); } catch (e) { console.log('Admin routes not available'); }
try { app.use('/api/password-reset', passwordResetRoutes); } catch (e) { console.log('Password reset routes not available'); }
try { app.use('/api/registration', registrationRoutes); } catch (e) { console.log('Registration routes not available'); }
try { app.use('/api/reports', reportsRoutes); } catch (e) { console.log('Reports routes not available'); }
try { app.use('/api/attendance', attendanceRoutes); } catch (e) { console.log('Attendance routes not available'); }
try { app.use('/api/attendance-test', attendanceTestRoutes); } catch (e) { console.log('Attendance test routes not available'); }
try { app.use('/api/health', healthRoutes); } catch (e) { console.log('Health routes not available'); }
try { app.use('/api/admin/settings', systemSettingsRoutes); } catch (e) { console.log('System settings routes not available'); }

// Schemes and Feedback
app.use('/api/schemes', schemesRoutes);
app.use('/api/feedback', feedbackRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SampoornaAngan API',
    version: '1.0.0',
    health: '/health',
    availableEndpoints: ['/api/schemes', '/api/auth', '/api/users', '/health']
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/', '/health', '/api/schemes']
  });
});

// Error handling
try {
  app.use(errorHandler);
} catch (e) {
  console.log('Custom error handler not available, using default');
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });
}

// Database connection (singleton)
let dbConnectingPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (dbConnectingPromise) return dbConnectingPromise;
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://sampoornaadmin:qiEbNqkB6fhm-2G@cluster0.8tilqvr.mongodb.net/sampoornaangan?retryWrites=true&w=majority&appName=Cluster0';
    console.log('🔗 Attempting to connect to MongoDB');
    dbConnectingPromise = mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(conn => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }).catch(err => {
      console.error('❌ Database connection error:', err.message);
      dbConnectingPromise = null;
      return null;
    });
    return dbConnectingPromise;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    dbConnectingPromise = null;
    return null;
  }
};

// Initiate connection on cold start (serverless-safe)
connectDB();

module.exports = app;
