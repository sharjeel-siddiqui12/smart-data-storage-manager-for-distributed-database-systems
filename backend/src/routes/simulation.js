import express from 'express';
import {
  simulateDriveFailure,
  simulateChunkCorruption,
  recoverCorruptedChunk,
  simulateHighLoad,
  generateRandomChunks,
  resetSimulation
} from '../controllers/simulationCOntroller.js';

const router = express.Router();

// POST /api/simulation/drive-failure - Simulate a drive failure
router.post('/drive-failure', simulateDriveFailure);

// POST /api/simulation/chunk-corruption - Simulate data chunk corruption
router.post('/chunk-corruption', simulateChunkCorruption);

// POST /api/simulation/recover-chunk - Recover corrupted chunk
router.post('/recover-chunk', recoverCorruptedChunk);

// POST /api/simulation/high-load - Simulate high load on drives
router.post('/high-load', simulateHighLoad);

// POST /api/simulation/generate-chunks - Generate random data chunks
router.post('/generate-chunks', generateRandomChunks);

// POST /api/simulation/reset - Reset simulation
router.post('/reset', resetSimulation);

export default router;