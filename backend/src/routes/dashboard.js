import express from 'express';
import {
  getDashboardSummary,
  getDriveAllocationAnalysis,
  getEventTimeline,
  getOptimizationRecommendations
} from '../controllers/dashboardController.js';

const router = express.Router();

// GET /api/dashboard/summary - Get dashboard summary data
router.get('/summary', getDashboardSummary);

// GET /api/dashboard/allocation - Get detailed drive allocation analysis
router.get('/allocation', getDriveAllocationAnalysis);

// GET /api/dashboard/events - Get event history timeline
router.get('/events', getEventTimeline);

// GET /api/dashboard/recommendations - Get optimization recommendations
router.get('/recommendations', getOptimizationRecommendations);

export default router;