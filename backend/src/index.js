import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import database from './config/database.js';

// Import routes
import driveRoutes from './routes/drives.js';
import chunkRoutes from './routes/chunks.js';
import policyRoutes from './routes/policies.js';
import metricRoutes from './routes/metrics.js';
import simulationRoutes from './routes/simulation.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
(async () => {
  try {
    await database.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

// Routes
app.use('/api/drives', driveRoutes);
app.use('/api/chunks', chunkRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Smart Storage System API',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle application shutdown
process.on('SIGINT', async () => {
  console.log('Application shutting down...');
  try {
    await database.closePool();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});