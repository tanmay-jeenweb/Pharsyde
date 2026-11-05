const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from Backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Database & Model-defined Table Initializer
const { testConnection } = require('./config/db');
const { initModelTables } = require('./models/index');

// Upload Configuration (referenced from Jasmin-CRM)
const uploadConfig = require('./config/uploadConfig');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const officeRoutes = require('./routes/officeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { getPublicSettings } = require('./controllers/settingController');
const uploadRoutes = require('./routes/uploadRoutes');
const appRoutes = require('./routes/appRoutes');

// Middlewares
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(
  cors({
    origin: (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : ['https://pharsyde.jeenhost.in', 'http://pharsyde.jeenhost.in', 'http://localhost:5173']),
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files statically if set to express (matching Jasmin-CRM)
if (uploadConfig.serveMethod === 'express') {
  console.log(`[UploadConfig] Serving uploaded files statically from: ${uploadConfig.uploadDir}`);
  app.use(
    '/uploads',
    express.static(uploadConfig.uploadDir, {
      setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    })
  );
}

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Pharsyde Backend API',
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/office', officeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments/moneris', paymentRoutes);
app.get('/api/settings/public', getPublicSettings);
app.use('/api/upload', uploadRoutes);
app.use('/api/app', appRoutes);

// Direct shortcut download URLs for easy user clicks / APK distribution
app.get('/download/app', (req, res) => res.redirect('/api/app/download'));
app.get('/download/apk', (req, res) => res.redirect('/api/app/download'));

// 404 & Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server and verify DB connection
const startServer = async () => {
  // Test MySQL Connection and initialize model tables
  const dbConnected = await testConnection();
  if (dbConnected) {
    try {
      await initModelTables();
      console.log('[Database] Model tables verified / initialized successfully.');
    } catch (err) {
      console.warn(`[Database Warning] Could not initialize model tables: ${err.message}`);
    }
  }

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Pharsyde Server running on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}`);
    console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`);
    console.log(`🏢 Office API: http://localhost:${PORT}/api/office`);
    console.log(`📱 App Version API: http://localhost:${PORT}/api/app/check-update`);
    console.log(`📥 App Download URL: http://localhost:${PORT}/download/apk`);
    console.log(`📁 Upload API: http://localhost:${PORT}/api/upload/document`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
};

startServer();

module.exports = app;
