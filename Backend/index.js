const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from Backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Database & Model-defined Table Initializer
const { testConnection } = require('./config/db');
const { initModelTables } = require('./models/index');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

// Middlewares
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
};

startServer();

module.exports = app;
