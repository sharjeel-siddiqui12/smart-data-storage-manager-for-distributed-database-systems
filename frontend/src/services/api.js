import axios from "axios";

// Create an axios instance for making API requests
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// API functions for drives
export const driveApi = {
  getAllDrives: () => api.get("/drives"),
  getDriveById: (id) => api.get(`/drives/${id}`),
  createDrive: (driveData) => api.post("/drives", driveData),
  updateDrive: (id, driveData) => api.put(`/drives/${id}`, driveData),
  deleteDrive: (id) => {
    return axios.delete(`/api/drives/${id}`);
  },
  deleteDriveForced: (id) => {
    return axios.delete(`/api/drives/${id}?force=true`);
  },
  getDriveStatistics: (id) => api.get(`/drives/${id}/statistics`),
  getDrivesHealth: () => api.get("/drives/health"),
};

// API functions for data chunks
export const chunkApi = {
  getAllChunks: () => api.get("/chunks"),
  getChunkById: (id) => api.get(`/chunks/${id}`),
  // Add these methods to chunkApi
  createChunk: (chunkData) => {
    return axios.post("/api/chunks", chunkData);
  },
  createLimitedReplicas: (chunkId, replicaCount) => {
    return axios.post(`/api/chunks/${chunkId}/replicas`, { replicaCount });
  },
  updateChunk: (id, chunkData) => api.put(`/chunks/${id}`, chunkData),
  deleteChunk: (id) => api.delete(`/chunks/${id}`),
  relocateChunk: (id, relocationData) =>
    api.post(`/chunks/${id}/relocate`, relocationData),
};

// API functions for policies
export const policyApi = {
  getAllPolicies: () => api.get("/policies"),
  getActivePolicy: () => api.get("/policies/active"),
  getPolicyById: (id) => api.get(`/policies/${id}`),
  createPolicy: (policyData) => api.post("/policies", policyData),
  updatePolicy: (id, policyData) => api.put(`/policies/${id}`, policyData),
  deletePolicy: (id) => api.delete(`/policies/${id}`),
  triggerRebalancing: () => api.post("/policies/rebalance"),
};

// API functions for metrics
export const metricApi = {
  getSystemMetrics: () => api.get("/metrics/system"),
  getSystemHealth: () => api.get("/metrics/health"),
  getDrivePerformanceMetrics: (hours) =>
    api.get(`/metrics/drives?hours=${hours || 24}`),
  getRedistributionHistory: (limit) =>
    api.get(`/metrics/redistributions?limit=${limit || 100}`),
  recordDriveMetric: (metricData) => api.post("/metrics/drives", metricData),
};

// API functions for simulation
export const simulationApi = {
  simulateDriveFailure: (failureData) =>
    api.post("/simulation/drive-failure", failureData),
  simulateChunkCorruption: (corruptionData) =>
    api.post("/simulation/chunk-corruption", corruptionData),
  recoverCorruptedChunk: (recoveryData) =>
    api.post("/simulation/recover-chunk", recoveryData),
  simulateHighLoad: (loadData) => api.post("/simulation/high-load", loadData),
  generateRandomChunks: (chunkData) =>
    api.post("/simulation/generate-chunks", chunkData),
  resetSimulation: () => api.post("/simulation/reset"),
  initializeSystemWithSampleData: () =>
    api.post("/simulation/initialize-system", {
      drivesCount: 5,
      chunksCount: 20,
      withReplication: true,
    }),
};

// API functions for dashboard
export const dashboardApi = {
  getDashboardSummary: () => api.get("/dashboard/summary"),
  getDriveAllocationAnalysis: () => api.get("/dashboard/allocation"),
  getEventTimeline: (limit) =>
    api.get(`/dashboard/events?limit=${limit || 20}`),
  getOptimizationRecommendations: () => api.get("/dashboard/recommendations"),
};

export default {
  driveApi,
  chunkApi,
  policyApi,
  metricApi,
  simulationApi,
  dashboardApi,
};
