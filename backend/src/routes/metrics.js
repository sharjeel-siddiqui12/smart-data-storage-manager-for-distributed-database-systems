import express from 'express';
import {
  getSystemMetrics,
  getDrivePerformanceMetrics,
  getRedistributionHistory,
  recordDriveMetric,
  getSystemHealth
} from '../controllers/metricController.js';

const router = express.Router();

// GET /api/metrics/system - Get system overview metrics
router.get('/system', getSystemMetrics);

// GET /api/metrics/health - Get system health overview
router.get('/health', getSystemHealth);

// GET /api/metrics/drives - Get performance metrics for drives
router.get('/drives', getDrivePerformanceMetrics);

// GET /api/metrics/redistributions - Get redistribution history
router.get('/redistributions', getRedistributionHistory);

// POST /api/metrics/drives - Record new drive metric
router.post('/drives', recordDriveMetric);

export default router;