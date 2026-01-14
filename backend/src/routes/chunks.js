import express from "express";
import * as chunkController from "../controllers/chunkController.js";

import {
  getAllChunks,
  getChunkById,
  createChunk,
  updateChunk,
  deleteChunk,
  relocateChunk,
} from "../controllers/chunkController.js";

const router = express.Router();

// GET /api/chunks - Get all chunks
router.get("/", getAllChunks);

// GET /api/chunks/:id - Get a single chunk
router.get("/:id", getChunkById);

// POST /api/chunks - Create a new chunk
router.post("/", createChunk);

// PUT /api/chunks/:id - Update a chunk
router.put("/:id", updateChunk);

// DELETE /api/chunks/:id - Delete a chunk
router.delete("/:id", deleteChunk);

// POST /api/chunks/:id/relocate - Relocate a chunk
router.post("/:id/relocate", relocateChunk);

router.post("/:id/replicas", chunkController.createLimitedReplicas); // Add this line

export default router;
