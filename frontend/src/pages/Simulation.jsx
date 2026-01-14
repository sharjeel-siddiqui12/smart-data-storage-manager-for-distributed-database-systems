import { useState, useEffect } from 'react';
import { simulationApi, driveApi, chunkApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { toast } from 'react-toastify';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  ServerStackIcon,
  CircleStackIcon,
  ShieldExclamationIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';

// Helper function to determine drive status based on utilization
const processDriveStatus = (drive) => {
  // Calculate utilization percentage
  const capacityUsed = drive.CAPACITY - drive.AVAILABLE_SPACE;
  const utilizationPercent = (capacityUsed / drive.CAPACITY) * 100;
  
  // Only override status if not already a hardware failure state
  if (drive.STATUS !== "FAILING" && drive.STATUS !== "FAILED") {
    if (utilizationPercent >= 95) {
      return "CRITICAL";
    } else if (utilizationPercent >= 85) {
      return "DEGRADED"; 
    } else if (utilizationPercent >= 70) {
      return "WARNING";
    }
  }
  
  return drive.STATUS;
};

const Simulation = () => {
  const [drives, setDrives] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulationInProgress, setSimulationInProgress] = useState(false);
  
  // Failure simulation modal
  const [failureModal, setFailureModal] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [failureType, setFailureType] = useState('degraded');
  
  // Corruption simulation modal
  const [corruptionModal, setCorruptionModal] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState(null);
  
  // Recovery modal
  const [recoveryModal, setRecoveryModal] = useState(false);
  const [corruptedChunks, setCorruptedChunks] = useState([]);
  
  // Load generator modal
  const [loadModal, setLoadModal] = useState(false);
  const [loadForm, setLoadForm] = useState({
    driveCount: 2,
    loadPercentage: 80
  });
  
  // Random chunks generator modal
  const [chunkGenModal, setChunkGenModal] = useState(false);
  const [chunkGenForm, setChunkGenForm] = useState({
    count: 5,
    minSize: 10000,
    maxSize: 50000,
    priority: 3
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [drivesRes, chunksRes] = await Promise.all([
        driveApi.getAllDrives(),
        chunkApi.getAllChunks()
      ]);
      
      // Process drives to update status based on utilization
      const processedDrives = drivesRes.data.map(drive => ({
        ...drive,
        STATUS: processDriveStatus(drive)
      }));
      
      setDrives(processedDrives);
      setChunks(chunksRes.data);
      
      // Filter corrupted chunks for recovery options
      setCorruptedChunks(chunksRes.data.filter(chunk => chunk.STATUS === 'CORRUPTED'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data for simulation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle drive failure simulation
  const handleOpenFailureModal = (drive) => {
    setSelectedDrive(drive);
    setFailureType('degraded');
    setFailureModal(true);
  };

  const handleSimulateFailure = async () => {
    if (!selectedDrive) return;
    
    try {
      setSimulationInProgress(true);
      await simulationApi.simulateDriveFailure({
        driveId: selectedDrive.DRIVE_ID,
        failureType: failureType
      });
      
      toast.success(`Drive ${failureType} failure simulated successfully`);
      setFailureModal(false);
      
      // Wait a bit before refreshing to allow for background processes
      setTimeout(() => {
        loadData();
        setSimulationInProgress(false);
      }, 1500);
    } catch (error) {
      console.error('Error simulating drive failure:', error);
      toast.error(error.response?.data?.error || 'Failed to simulate failure');
      setSimulationInProgress(false);
    }
  };

  // Handle chunk corruption simulation
  const handleOpenCorruptionModal = (chunk) => {
    setSelectedChunk(chunk);
    setCorruptionModal(true);
  };

  const handleSimulateCorruption = async () => {
    if (!selectedChunk) return;
    
    try {
      setSimulationInProgress(true);
      await simulationApi.simulateChunkCorruption({
        chunkId: selectedChunk.CHUNK_ID
      });
      
      toast.success(`Data chunk corruption simulated successfully`);
      setCorruptionModal(false);
      
      // Wait a bit before refreshing
      setTimeout(() => {
        loadData();
        setSimulationInProgress(false);
      }, 1000);
    } catch (error) {
      console.error('Error simulating chunk corruption:', error);
      toast.error(error.response?.data?.error || 'Failed to simulate corruption');
      setSimulationInProgress(false);
    }
  };

  // Handle chunk recovery
  const handleOpenRecoveryModal = () => {
    loadData(); // Refresh to get latest corrupted chunks
    setRecoveryModal(true);
  };

  const handleRecoverChunk = async (chunk) => {
    try {
      setSimulationInProgress(true);
      await simulationApi.recoverCorruptedChunk({
        chunkId: chunk.CHUNK_ID
      });
      
      toast.success(`Data chunk recovered successfully`);
      
      // Refresh corrupted chunks list
      loadData();
      setSimulationInProgress(false);
    } catch (error) {
      console.error('Error recovering chunk:', error);
      toast.error(error.response?.data?.error || 'Failed to recover chunk');
      setSimulationInProgress(false);
    }
  };

  // Handle high load simulation
  const handleOpenLoadModal = () => {
    setLoadForm({
      driveCount: 2,
      loadPercentage: 80
    });
    setLoadModal(true);
  };

  const handleLoadFormChange = (e) => {
    const { name, value } = e.target;
    setLoadForm({
      ...loadForm,
      [name]: parseInt(value)
    });
  };

  const handleSimulateHighLoad = async () => {
    try {
      setSimulationInProgress(true);
      await simulationApi.simulateHighLoad(loadForm);
      
      toast.success(`High load simulation completed successfully`);
      setLoadModal(false);
      
      // Wait before refreshing
      setTimeout(() => {
        loadData();
        setSimulationInProgress(false);
      }, 1500);
    } catch (error) {
      console.error('Error simulating high load:', error);
      toast.error(error.response?.data?.error || 'Failed to simulate high load');
      setSimulationInProgress(false);
    }
  };

  // Handle random chunks generation
  const handleOpenChunkGenModal = () => {
    setChunkGenForm({
      count: 5,
      minSize: 10000,
      maxSize: 50000,
      priority: 3
    });
    setChunkGenModal(true);
  };

  const handleChunkGenFormChange = (e) => {
    const { name, value } = e.target;
    setChunkGenForm({
      ...chunkGenForm,
      [name]: parseInt(value)
    });
  };

  const handleGenerateRandomChunks = async () => {
    try {
      setSimulationInProgress(true);
      await simulationApi.generateRandomChunks(chunkGenForm);
      
      toast.success(`Random chunks generated successfully`);
      setChunkGenModal(false);
      
      // Wait before refreshing
      setTimeout(() => {
        loadData();
        setSimulationInProgress(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating chunks:', error);
      toast.error(error.response?.data?.error || 'Failed to generate random chunks');
      setSimulationInProgress(false);
    }
  };

  // Handle reset simulation
  const handleResetSimulation = async () => {
    if (!confirm('Are you sure you want to reset all simulation data? This will delete all test data chunks and restore drives to healthy status.')) {
      return;
    }
    
    try {
      setSimulationInProgress(true);
      await simulationApi.resetSimulation();
      
      toast.success(`Simulation reset successfully`);
      
      // Wait before refreshing
      setTimeout(() => {
        loadData();
        setSimulationInProgress(false);
      }, 1500);
    } catch (error) {
      console.error('Error resetting simulation:', error);
      toast.error(error.response?.data?.error || 'Failed to reset simulation');
      setSimulationInProgress(false);
    }
  };

  // Calculate utilization percentage for a drive
  const calculateUtilization = (drive) => {
    return ((drive.CAPACITY - drive.AVAILABLE_SPACE) / drive.CAPACITY * 100).toFixed(2);
  };

  // Get appropriate row class based on drive status
  const getDriveRowClass = (drive) => {
    const status = processDriveStatus(drive);
    
    if (status === 'CRITICAL' || status === 'FAILING' || status === 'FAILED') {
      return 'bg-danger-50';
    }
    if (status === 'DEGRADED') {
      return 'bg-warning-50';
    }
    
    return '';
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Simulation Tools</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={loadData}
            disabled={loading || simulationInProgress}
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleResetSimulation}
            disabled={loading || simulationInProgress}
          >
            Reset Simulation
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-5 bg-primary-50 border border-primary-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <BeakerIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-primary-800">Simulation Environment</h3>
            <p className="mt-1 text-primary-700">
              This page provides tools to simulate various scenarios like drive failures, data corruption, and high load conditions.
              These simulations help test the system's resilience and failure recovery mechanisms.
            </p>
            <p className="mt-2 text-primary-700">
              <strong>Note:</strong> The simulations use real data operations but are marked for easy cleanup.
            </p>
          </div>
        </div>
      </Card>

      {/* Simulation Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <Card title="Drive Failure Simulation">
          <p className="text-gray-600 mb-4">
            Test the system's ability to handle drive failures and automatically redistribute data to backup drives.
          </p>
          <Button
            variant="warning"
            icon={<ServerStackIcon className="w-5 h-5 mr-2" />}
            onClick={handleOpenLoadModal}
            disabled={simulationInProgress}
          >
            Simulate High Load
          </Button>
        </Card>

        <Card title="Data Integrity Simulation">
          <p className="text-gray-600 mb-4">
            Simulate data corruption and test the recovery process using replicated data.
          </p>
          <div className="flex space-x-3">
            {corruptedChunks.length > 0 && (
              <Button
                variant="success"
                icon={<ArrowPathRoundedSquareIcon className="w-5 h-5 mr-2" />}
                onClick={handleOpenRecoveryModal}
                disabled={simulationInProgress}
              >
                Recover Corrupted Chunks
              </Button>
            )}
          </div>
        </Card>

        <Card title="Data Generation">
          <p className="text-gray-600 mb-4">
            Generate random data chunks for testing storage distribution and balance algorithms.
          </p>
          <Button
            variant="primary"
            icon={<CircleStackIcon className="w-5 h-5 mr-2" />}
            onClick={handleOpenChunkGenModal}
            disabled={simulationInProgress}
          >
            Generate Random Chunks
          </Button>
        </Card>
      </div>

      {/* Drive List */}
      <Card title="Available Drives for Simulation" className="mb-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drive Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity Used
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backup
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : drives.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No drives found
                  </td>
                </tr>
              ) : (
                drives.map((drive) => {
                  // Calculate utilization percentage for UI display
                  const utilizationPct = calculateUtilization(drive);
                  // Get the processed status accounting for utilization
                  const processedStatus = processDriveStatus(drive);
                  
                  return (
                    <tr 
                      key={drive.DRIVE_ID} 
                      className={getDriveRowClass(drive)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {drive.DRIVE_NAME}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drive.DRIVE_TYPE}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(drive.CAPACITY - drive.AVAILABLE_SPACE).toLocaleString()} / {drive.CAPACITY.toLocaleString()} MB
                        <div className="text-xs mt-1">
                          {utilizationPct}% utilized
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={processedStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drive.IS_BACKUP ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {processedStatus !== 'FAILED' && (
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleOpenFailureModal(drive)}
                            disabled={simulationInProgress}
                          >
                            Simulate Failure
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Data Chunks List */}
      <Card title="Data Chunks for Simulation">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chunk Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drive
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Replicated
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : chunks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No data chunks found
                  </td>
                </tr>
              ) : (
                chunks.map((chunk) => (
                  <tr key={chunk.CHUNK_ID} className={chunk.STATUS === 'CORRUPTED' ? 'bg-danger-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {chunk.CHUNK_NAME}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(chunk.SIZE_MB / 1024).toFixed(2)} GB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {chunk.DRIVE_NAME}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={chunk.STATUS} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {chunk.REPLICATED === 1 ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {chunk.STATUS !== 'CORRUPTED' && chunk.REPLICATED === 1 && (
                        <Button
                          variant="warning"
                          size="xs"
                          onClick={() => handleOpenCorruptionModal(chunk)}
                          disabled={simulationInProgress}
                        >
                          Corrupt
                        </Button>
                      )}
                      {chunk.STATUS === 'CORRUPTED' && (
                        <Button
                          variant="success"
                          size="xs"
                          onClick={() => handleRecoverChunk(chunk)}
                          disabled={simulationInProgress}
                        >
                          Recover
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drive Failure Simulation Modal */}
      <Modal
        open={failureModal}
        onClose={() => setFailureModal(false)}
        title="Simulate Drive Failure"
      >
        <div className="mb-4">
          <div className="bg-warning-50 p-3 rounded-md border border-warning-200 mb-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mr-2" />
              <p className="text-sm text-warning-700">
                This will simulate a drive failure which will trigger data redistribution. Drive: <strong>{selectedDrive?.DRIVE_NAME}</strong>
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Failure Type
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-primary-600"
                  name="failureType"
                  value="degraded"
                  checked={failureType === 'degraded'}
                  onChange={() => setFailureType('degraded')}
                />
                <span className="ml-2 text-sm text-gray-700">Degraded Performance</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-primary-600"
                  name="failureType"
                  value="failing"
                  checked={failureType === 'failing'}
                  onChange={() => setFailureType('failing')}
                />
                <span className="ml-2 text-sm text-gray-700">Failing (Redistribution)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-primary-600"
                  name="failureType"
                  value="complete"
                  checked={failureType === 'complete'}
                  onChange={() => setFailureType('complete')}
                />
                <span className="ml-2 text-sm text-gray-700">Complete Failure</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Expected System Response:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Drive status will change to {failureType === 'degraded' ? 'DEGRADED' : failureType === 'failing' ? 'FAILING' : 'FAILED'}</li>
              {failureType !== 'degraded' && <li>System will automatically redistribute data chunks to backup drives</li>}
              {failureType === 'complete' && <li>Drive will be marked as completely failed and unavailable for future use</li>}
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setFailureModal(false)}
            disabled={simulationInProgress}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleSimulateFailure}
            disabled={simulationInProgress}
          >
            {simulationInProgress ? 'Simulating...' : 'Simulate Failure'}
          </Button>
        </div>
      </Modal>

      {/* Data Corruption Modal */}
      <Modal
        open={corruptionModal}
        onClose={() => setCorruptionModal(false)}
        title="Simulate Data Corruption"
      >
        <div className="mb-4">
          <div className="bg-warning-50 p-3 rounded-md border border-warning-200 mb-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mr-2" />
              <p className="text-sm text-warning-700">
                This will simulate data corruption for the selected chunk. The system will detect the corruption and allow you to recover from replicas.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Chunk Details:</h4>
            <ul className="text-sm text-gray-600">
              <li><span className="font-medium">Name:</span> {selectedChunk?.CHUNK_NAME}</li>
              <li><span className="font-medium">Size:</span> {selectedChunk ? (selectedChunk.SIZE_MB / 1024).toFixed(2) + ' GB' : ''}</li>
              <li><span className="font-medium">Current Drive:</span> {selectedChunk?.DRIVE_NAME}</li>
              <li>
                <span className="font-medium">Replication Status:</span>
                {selectedChunk?.REPLICATED === 1 ? ' Has replicas (can recover)' : ' No replicas (recovery not possible)'}
              </li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Expected System Response:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Chunk status will change to CORRUPTED</li>
              <li>Recovery option will become available</li>
              <li>When recovered, data will be restored from the replica</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setCorruptionModal(false)}
            disabled={simulationInProgress}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleSimulateCorruption}
            disabled={simulationInProgress}
          >
            {simulationInProgress ? 'Simulating...' : 'Simulate Corruption'}
          </Button>
        </div>
      </Modal>

      {/* Recovery Modal */}
      <Modal
        open={recoveryModal}
        onClose={() => setRecoveryModal(false)}
        title="Recover Corrupted Data"
        size="lg"
      >
        <div className="mb-4">
          <div className="bg-primary-50 p-3 rounded-md border border-primary-200 mb-4">
            <div className="flex">
              <ShieldExclamationIcon className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-primary-700">
                The following data chunks are corrupted and need recovery. Recovery will restore the data from replicas.
              </p>
            </div>
          </div>
          
          {corruptedChunks.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No corrupted chunks found that need recovery.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chunk Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drive
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {corruptedChunks.map((chunk) => (
                    <tr key={chunk.CHUNK_ID} className="bg-danger-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {chunk.CHUNK_NAME}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {(chunk.SIZE_MB / 1024).toFixed(2)} GB
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {chunk.DRIVE_NAME}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={chunk.STATUS} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="success"
                          size="xs"
                          onClick={() => handleRecoverChunk(chunk)}
                          disabled={simulationInProgress}
                        >
                          {simulationInProgress ? 'Recovering...' : 'Recover'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setRecoveryModal(false)}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Load Simulation Modal */}
      <Modal
        open={loadModal}
        onClose={() => setLoadModal(false)}
        title="Simulate High Load"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            This simulation will create large test chunks to simulate high utilization on selected drives. 
            If utilization exceeds rebalance threshold, automatic rebalancing may trigger.
          </p>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="driveCount" className="block text-sm font-medium text-gray-700">
                Number of Drives
              </label>
              <select
                name="driveCount"
                id="driveCount"
                value={loadForm.driveCount}
                onChange={handleLoadFormChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="1">1 Drive</option>
                <option value="2">2 Drives</option>
                <option value="3">3 Drives</option>
                <option value="4">4 Drives</option>
                <option value="5">5 Drives</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Number of drives to put under load
              </p>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="loadPercentage" className="block text-sm font-medium text-gray-700">
                Target Utilization
              </label>
              <select
                name="loadPercentage"
                id="loadPercentage"
                value={loadForm.loadPercentage}
                onChange={handleLoadFormChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="50">50% (Moderate)</option>
                <option value="70">70% (High)</option>
                <option value="80">80% (Very High)</option>
                <option value="90">90% (Critical)</option>
                <option value="95">95% (Extreme)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Target utilization percentage
              </p>
            </div>
            
            <div className="sm:col-span-6">
              <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                <p className="text-sm text-primary-700">
                  <strong>Note:</strong> If target utilization exceeds the system's rebalance threshold (typically 80%), automatic data redistribution may be triggered.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setLoadModal(false)}
            disabled={simulationInProgress}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSimulateHighLoad}
            disabled={simulationInProgress}
          >
            {simulationInProgress ? 'Simulating...' : 'Simulate Load'}
          </Button>
        </div>
      </Modal>

      {/* Generate Random Chunks Modal */}
      <Modal
        open={chunkGenModal}
        onClose={() => setChunkGenModal(false)}
        title="Generate Random Data Chunks"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Generate random test data chunks for simulation. These chunks will be automatically placed on optimal drives.
          </p>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="count" className="block text-sm font-medium text-gray-700">
                Number of Chunks
              </label>
              <select
                name="count"
                id="count"
                value={chunkGenForm.count}
                onChange={handleChunkGenFormChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="1">1 Chunk</option>
                <option value="5">5 Chunks</option>
                <option value="10">10 Chunks</option>
                <option value="15">15 Chunks</option>
                <option value="20">20 Chunks</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                value={chunkGenForm.priority}
                onChange={handleChunkGenFormChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="1">1 - Low</option>
                <option value="2">2 - Low-Medium</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Medium-High</option>
                <option value="5">5 - High</option>
              </select>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="minSize" className="block text-sm font-medium text-gray-700">
                Min Size (MB)
              </label>
              <input
                type="number"
                name="minSize"
                id="minSize"
                value={chunkGenForm.minSize}
                onChange={handleChunkGenFormChange}
                min="1000"
                max="1000000"
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="maxSize" className="block text-sm font-medium text-gray-700">
                Max Size (MB)
              </label>
              <input
                type="number"
                name="maxSize"
                id="maxSize"
                value={chunkGenForm.maxSize}
                onChange={handleChunkGenFormChange}
                min="1000"
                max="1000000"
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="sm:col-span-6">
              <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                <p className="text-sm text-primary-700">
                  <strong>Note:</strong> Generated chunks will have random sizes between min and max values. 
                  Some will be created with replicas based on the active distribution policy.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setChunkGenModal(false)}
            disabled={simulationInProgress}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerateRandomChunks}
            disabled={simulationInProgress}
          >
            {simulationInProgress ? 'Generating...' : 'Generate Chunks'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Simulation;