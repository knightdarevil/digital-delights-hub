require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow localhost and any origin for development
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  /\.lovable\.app$/  // Allow all lovable.app subdomains
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
  credentials: true
}));

// Security headers (relaxed for development)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// API Routes
const driveRoutes = require('./routes/drive');
const licenseRoutes = require('./routes/license');

app.use('/api/drive', driveRoutes);
app.use('/api/license', licenseRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Backend API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      // Drive endpoints
      listFolder: '/api/drive/list-folder/:folderId',
      listCategory: '/api/drive/list/:category',
      getFile: '/api/drive/file/:fileId',
      download: '/api/drive/download/:fileId (auth required)',
      // License endpoints
      licenseVerify: 'POST /api/license/verify',
      licenseActivate: 'POST /api/license/activate',
      licenseCheck: 'POST /api/license/check',
      licenseDeactivate: 'POST /api/license/deactivate'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🚀 ====================================');
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Drive API: http://localhost:${PORT}/api/drive`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
