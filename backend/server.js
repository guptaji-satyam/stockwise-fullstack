const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS for frontend requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logger in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root API information endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'StockWise – Smart Inventory & Order Management System API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only when executed directly (not when required by tests)
if (require.main === module) {
  connectDB().then(async () => {
    // Automatically seed default admin, staff and demo items if database is empty
    try {
      const { autoSeedIfEmpty } = require('./seed/seedData');
      await autoSeedIfEmpty();
    } catch (seedErr) {
      console.warn('[Server Startup] AutoSeed warning:', seedErr.message);
    }

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` StockWise Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(` Listening on port: ${PORT}`);
      console.log(` API URL: http://localhost:${PORT}`);
      console.log(`=================================================`);
    });
  });
}

module.exports = app;
