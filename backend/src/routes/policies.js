import express from 'express';
import {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  triggerRebalancing,
  getActivePolicy
} from '../controllers/policyController.js';

const router = express.Router();

// GET /api/policies - Get all policies
router.get('/', getAllPolicies);

// GET /api/policies/active - Get active policy
router.get('/active', getActivePolicy);

// GET /api/policies/:id - Get a single policy
router.get('/:id', getPolicyById);

// POST /api/policies - Create a new policy
router.post('/', createPolicy);

// PUT /api/policies/:id - Update a policy
router.put('/:id', updatePolicy);

// DELETE /api/policies/:id - Delete a policy
router.delete('/:id', deletePolicy);

// POST /api/policies/rebalance - Trigger rebalancing
router.post('/rebalance', triggerRebalancing);

export default router;