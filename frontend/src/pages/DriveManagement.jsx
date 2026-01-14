import { useState, useEffect } from 'react';
import { driveApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { toast } from 'react-toastify';
import { 
  PlusIcon, 
  ArrowPathIcon, 
  PencilIcon, 
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const DriveManagement = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [driveForm, setDriveForm] = useState({
    driveName: '',
    location: '',
    capacity: '',
    availableSpace: '',
    status: 'HEALTHY',
    driveType: 'SSD',
    isBackup: false
  });

  const [deleteModal, setDeleteModal] = useState(false);
  const [driveToDelete, setDriveToDelete] = useState(null);
  const [statsModal, setStatsModal] = useState(false);
  const [driveStats, setDriveStats] = useState(null);
  const [showForceDelete, setShowForceDelete] = useState(false);
  const [dependencies, setDependencies] = useState(null);

  const loadDrives = async () => {
    try {
      setLoading(true);
      const res = await driveApi.getAllDrives();
      
      // Process drives to correctly set status based on utilization
      const processedDrives = res.data.map(drive => {
        const utilizationPct = ((drive.CAPACITY - drive.AVAILABLE_SPACE) / drive.CAPACITY * 100);
        
        // Only override status if it's not already a hardware failure status
        let updatedStatus = drive.STATUS;
        if (drive.STATUS !== 'FAILING' && drive.STATUS !== 'FAILED') {
          // Update status based on utilization thresholds
          if (utilizationPct >= 95) {
            updatedStatus = 'CRITICAL';
          } else if (utilizationPct >= 85) {
            updatedStatus = 'DEGRADED';
          } else if (utilizationPct >= 70) {
            updatedStatus = 'WARNING';
          }
          // If below 70%, keep as is (likely HEALTHY)
        }
        
        return {
          ...drive,
          STATUS: updatedStatus
        };
      });
      
      setDrives(processedDrives);
    } catch (error) {
      console.error('Error loading drives:', error);
      toast.error('Failed to load drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDriveForm({
      ...driveForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setDriveForm({
      driveName: '',
      location: '',
      capacity: '',
      availableSpace: '',
      status: 'HEALTHY',
      driveType: 'SSD',
      isBackup: false
    });
    setEditDrive(null);
  };

  const handleOpenModal = (drive = null) => {
    if (drive) {
      setEditDrive(drive);
      setDriveForm({
        driveName: drive.DRIVE_NAME,
        location: drive.LOCATION,
        capacity: drive.CAPACITY,
        availableSpace: drive.AVAILABLE_SPACE,
        status: drive.STATUS,
        driveType: drive.DRIVE_TYPE,
        isBackup: drive.IS_BACKUP === 1
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editDrive) {
        await driveApi.updateDrive(editDrive.DRIVE_ID, driveForm);
        toast.success('Drive updated successfully');
      } else {
        await driveApi.createDrive(driveForm);
        toast.success('Drive created successfully');
      }
      handleCloseModal();
      loadDrives();
    } catch (error) {
      console.error('Error saving drive:', error);
      toast.error(error.response?.data?.error || 'Failed to save drive');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await driveApi.deleteDrive(driveToDelete.DRIVE_ID);
      toast.success('Drive deleted successfully');
      setDeleteModal(false);
      setDriveToDelete(null);
      loadDrives();
    } catch (error) {
      // Check if this is a dependency error (409 Conflict)
      if (error.response?.status === 409 && error.response?.data?.dependencies) {
        const deps = error.response.data.dependencies;
        setDependencies(deps);
        setShowForceDelete(true);
      } else {
        console.error('Error deleting drive:', error);
        toast.error(error.response?.data?.error || 'Failed to delete drive');
      }
    }
  };

  // Add a new function for force delete
  const handleForceDelete = async () => {
    try {
      await driveApi.deleteDriveForced(driveToDelete.DRIVE_ID);
      toast.success('Drive and its dependencies deleted successfully');
      setDeleteModal(false);
      setDriveToDelete(null);
      setShowForceDelete(false);
      setDependencies(null);
      loadDrives();
    } catch (error) {
      console.error('Error force deleting drive:', error);
      toast.error(error.response?.data?.error || 'Failed to delete drive');
    }
  };

  const handleOpenDeleteModal = (drive) => {
    setDriveToDelete(drive);
    setDeleteModal(true);
  };

  const handleViewStats = async (drive) => {
    try {
      const res = await driveApi.getDriveStatistics(drive.DRIVE_ID);
      setDriveStats({
        drive: drive,
        stats: res.data
      });
      setStatsModal(true);
    } catch (error) {
      console.error('Error loading drive statistics:', error);
      toast.error('Failed to load drive statistics');
    }
  };

  const calculateUtilization = (drive) => {
    return ((drive.CAPACITY - drive.AVAILABLE_SPACE) / drive.CAPACITY * 100).toFixed(2);
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Drive Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            icon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={loadDrives}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={() => handleOpenModal()}
          >
            Add Drive
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drive Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity (MB)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
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
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : drives.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No drives found
                  </td>
                </tr>
              ) : (
                drives.map((drive) => (
                  <tr key={drive.DRIVE_ID} className={drive.STATUS === 'FAILING' || drive.STATUS === 'FAILED' || drive.STATUS === 'CRITICAL' ? 'bg-danger-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {drive.DRIVE_NAME}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {drive.LOCATION}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {drive.DRIVE_TYPE}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(drive.CAPACITY / 1024).toFixed(2)} GB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            calculateUtilization(drive) >= 95 ? 'bg-danger-500' : 
                            calculateUtilization(drive) >= 85 ? 'bg-warning-500' : 
                            calculateUtilization(drive) >= 70 ? 'bg-primary-500' : 'bg-success-500'
                          }`} 
                          style={{ width: `${calculateUtilization(drive)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs mt-1">
                        {calculateUtilization(drive)}% ({((drive.CAPACITY - drive.AVAILABLE_SPACE) / 1024).toFixed(2)} / {(drive.CAPACITY / 1024).toFixed(2)} GB)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={drive.STATUS} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {drive.IS_BACKUP ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewStats(drive)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Statistics"
                        >
                          <ChartBarIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(drive)}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Edit Drive"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(drive)}
                          className="text-danger-600 hover:text-danger-900"
                          title="Delete Drive"
                          disabled={drive.CHUNKS_COUNT > 0 || drive.STATUS === 'CRITICAL'}
                        >
                          <TrashIcon className={`h-5 w-5 ${(drive.CHUNKS_COUNT > 0 || drive.STATUS === 'CRITICAL') ? 'opacity-50 cursor-not-allowed' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Drive Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editDrive ? `Edit Drive: ${editDrive.DRIVE_NAME}` : 'Add New Drive'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="driveName" className="block text-sm font-medium text-gray-700">
                Drive Name
              </label>
              <input
                type="text"
                name="driveName"
                id="driveName"
                required
                value={driveForm.driveName}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                required
                value={driveForm.location}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacity (MB)
              </label>
              <input
                type="number"
                name="capacity"
                id="capacity"
                required
                min="1"
                value={driveForm.capacity}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="availableSpace" className="block text-sm font-medium text-gray-700">
                Available Space (MB)
              </label>
              <input
                type="number"
                name="availableSpace"
                id="availableSpace"
                required
                min="0"
                max={driveForm.capacity}
                value={driveForm.availableSpace}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {driveForm.availableSpace <= 0.05 * driveForm.capacity && (
                <p className="mt-1 text-xs text-danger-500">
                  Warning: Drive has very little available space and will be marked as CRITICAL.
                </p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="driveType" className="block text-sm font-medium text-gray-700">
                Drive Type
              </label>
              <select
                name="driveType"
                id="driveType"
                required
                value={driveForm.driveType}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="SSD">SSD</option>
                <option value="HDD">HDD</option>
                <option value="NVMe">NVMe</option>
                <option value="SATA">SATA</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                id="status"
                required
                value={driveForm.status}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="WARNING">WARNING</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="FAILING">FAILING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="sm:col-span-6">
              <div className="flex items-center">
                <input
                  id="isBackup"
                  name="isBackup"
                  type="checkbox"
                  checked={driveForm.isBackup}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isBackup" className="ml-2 block text-sm text-gray-700">
                  Use as backup drive
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Backup drives are used for storing replicas and recovering data during failures.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editDrive ? 'Update Drive' : 'Add Drive'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal}
        onClose={() => {
          setDeleteModal(false);
          setDriveToDelete(null);
          setShowForceDelete(false);
          setDependencies(null);
        }}
        title="Delete Drive"
        size="sm"
      >
        <div className="text-sm text-gray-500">
          {!showForceDelete ? (
            <>
              <p>Are you sure you want to delete drive <span className="font-medium text-gray-700">{driveToDelete?.DRIVE_NAME}</span>?</p>
              <p className="mt-2">This action cannot be undone. This will permanently delete the drive from the system.</p>
            </>
          ) : (
            <>
              <div className="bg-warning-50 border border-warning-200 rounded-md p-3 mb-3">
                <p className="text-warning-800 font-medium">Warning: This drive has dependencies</p>
                <ul className="mt-2 list-disc list-inside text-warning-700 space-y-1">
                  {dependencies.chunks > 0 && (
                    <li>{dependencies.chunks} data chunk{dependencies.chunks > 1 ? 's' : ''}</li>
                  )}
                  {dependencies.replicas > 0 && (
                    <li>{dependencies.replicas} replica{dependencies.replicas > 1 ? 's' : ''}</li>
                  )}
                  {dependencies.metrics > 0 && (
                    <li>{dependencies.metrics} metric record{dependencies.metrics > 1 ? 's' : ''}</li>
                  )}
                  {dependencies.logs > 0 && (
                    <li>{dependencies.logs} redistribution log{dependencies.logs > 1 ? 's' : ''}</li>
                  )}
                </ul>
              </div>
              <p>Are you <span className="font-bold">absolutely sure</span> you want to delete this drive and all its dependencies?</p>
              <p className="mt-2 text-danger-600">All data on this drive will be permanently lost.</p>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => {
              setDeleteModal(false);
              setDriveToDelete(null);
              setShowForceDelete(false);
              setDependencies(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            type="button" 
            onClick={showForceDelete ? handleForceDelete : handleDelete}
          >
            {showForceDelete ? 'Force Delete' : 'Delete'}
          </Button>
        </div>
      </Modal>

      {/* Drive Statistics Modal */}
      <Modal
        open={statsModal}
        onClose={() => setStatsModal(false)}
        title={`Statistics for ${driveStats?.drive.DRIVE_NAME}`}
        size="lg"
      >
        {driveStats && (
          <div className="space-y-6">
            {/* Drive Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Drive Type</h4>
                <p className="mt-1 text-lg font-semibold">{driveStats.drive.DRIVE_TYPE}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1 text-lg font-semibold">{driveStats.drive.LOCATION}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="mt-1"><StatusBadge status={driveStats.drive.STATUS} /></p>
              </div>
            </div>
            
            {/* Usage Statistics */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Usage Statistics</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-2">
                  <span className="text-sm text-gray-500">Storage Utilization</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div 
                      className={`h-2.5 rounded-full ${
                        calculateUtilization(driveStats.drive) >= 95 ? 'bg-danger-500' : 
                        calculateUtilization(driveStats.drive) >= 85 ? 'bg-warning-500' : 
                        calculateUtilization(driveStats.drive) >= 70 ? 'bg-primary-500' : 'bg-success-500'
                      }`} 
                      style={{ width: `${calculateUtilization(driveStats.drive)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Total Size</h4>
                    <p className="mt-1 text-lg font-semibold">{(driveStats.drive.CAPACITY / 1024).toFixed(2)} GB</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Available Space</h4>
                    <p className="mt-1 text-lg font-semibold">{(driveStats.drive.AVAILABLE_SPACE / 1024).toFixed(2)} GB</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Data Chunks</h4>
                    <p className="mt-1 text-lg font-semibold">{driveStats.stats.chunks?.count || 0}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Replicas</h4>
                    <p className="mt-1 text-lg font-semibold">{driveStats.stats.replicas?.count || 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            {driveStats.stats.metrics && driveStats.stats.metrics.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Metrics</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">CPU Usage</h4>
                      <p className="mt-1 text-lg font-semibold">
                        {driveStats.stats.metrics[0].CPU_USAGE}%
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">I/O Throughput</h4>
                      <p className="mt-1 text-lg font-semibold">
                        {driveStats.stats.metrics[0].IO_THROUGHPUT} MB/s
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Response Time</h4>
                      <p className="mt-1 text-lg font-semibold">
                        {driveStats.stats.metrics[0].RESPONSE_TIME} ms
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Error Rate</h4>
                      <p className="mt-1 text-lg font-semibold">
                        {(driveStats.stats.metrics[0].ERROR_RATE * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Temperature</h4>
                      <p className="mt-1 text-lg font-semibold">
                        {driveStats.stats.metrics[0].TEMPERATURE}°C
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Recorded At</h4>
                      <p className="mt-1 text-sm">
                        {new Date(driveStats.stats.metrics[0].RECORDED_AT).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" type="button" onClick={() => setStatsModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DriveManagement;