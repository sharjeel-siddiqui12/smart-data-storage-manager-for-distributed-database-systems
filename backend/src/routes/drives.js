import express from 'express';
import {
  getAllDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  getDriveStatistics,
  getDrivesHealth
} from '../controllers/driveController.js';

const router = express.Router();

// GET /api/drives - Get all drives
router.get('/', getAllDrives);

// GET /api/drives/health - Get drives with health status
router.get('/health', getDrivesHealth);

// GET /api/drives/:id - Get a single drive
router.get('/:id', getDriveById);

// GET /api/drives/:id/statistics - Get drive statistics
router.get('/:id/statistics', getDriveStatistics);

// POST /api/drives - Create a new drive
router.post('/', createDrive);

// PUT /api/drives/:id - Update a drive
router.put('/:id', updateDrive);

// DELETE /api/drives/:id - Delete a drive
router.delete('/:id', deleteDrive);

export default router;