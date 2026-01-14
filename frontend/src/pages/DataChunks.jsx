import { useState, useEffect } from "react";
import { chunkApi, driveApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import { toast } from "react-toastify";
import {
  PlusIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownOnSquareIcon,
} from "@heroicons/react/24/outline";

const DataChunks = () => {
  const [chunks, setChunks] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editChunk, setEditChunk] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [chunkToDelete, setChunkToDelete] = useState(null);
  const [relocateModal, setRelocateModal] = useState(false);
  const [chunkToRelocate, setChunkToRelocate] = useState(null);
  const [targetDriveId, setTargetDriveId] = useState("");
  const [insufficientBackupDrivesModal, setInsufficientBackupDrivesModal] =
    useState(false);
  const [backupDrivesInfo, setBackupDrivesInfo] = useState(null);
  const [pendingChunkId, setPendingChunkId] = useState(null);

  const [chunkForm, setChunkForm] = useState({
    chunkName: "",
    sizeMb: "",
    driveId: "",
    priority: 3,
    replicated: false,
    checksum: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [chunksRes, drivesRes] = await Promise.all([
        chunkApi.getAllChunks(),
        driveApi.getAllDrives(),
      ]);
      setChunks(chunksRes.data);
      setDrives(drivesRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setChunkForm({
      ...chunkForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setChunkForm({
      chunkName: "",
      sizeMb: "",
      driveId: "",
      priority: 3,
      replicated: false,
      checksum: "",
    });
    setEditChunk(null);
  };

  const handleOpenModal = (chunk = null) => {
    if (chunk) {
      setEditChunk(chunk);
      setChunkForm({
        chunkName: chunk.CHUNK_NAME,
        sizeMb: chunk.SIZE_MB,
        driveId: chunk.DRIVE_ID,
        priority: chunk.PRIORITY,
        replicated: chunk.REPLICATED === 1,
        checksum: chunk.CHECKSUM || "",
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
      const response = await chunkApi.createChunk(chunkForm);

      // Check if there was a warning about insufficient backup drives
      if (response.data.warning === "insufficient_backup_drives") {
        setBackupDrivesInfo({
          available: response.data.availableBackupDrives,
          required: response.data.requiredReplicas,
        });
        setPendingChunkId(response.data.chunkId);
        setInsufficientBackupDrivesModal(true);
      } else {
        toast.success("Data chunk created successfully");
        handleCloseModal();
        loadData();
      }
    } catch (error) {
      console.error("Error creating chunk:", error);
      toast.error(error.response?.data?.error || "Failed to create data chunk");
    }
  };

  // Add function to create limited replicas
  const handleCreateLimitedReplicas = async () => {
    try {
      await chunkApi.createLimitedReplicas(
        pendingChunkId,
        backupDrivesInfo.available
      );
      toast.success(
        `Created ${backupDrivesInfo.available} replicas successfully`
      );
      setInsufficientBackupDrivesModal(false);
      setPendingChunkId(null);
      setBackupDrivesInfo(null);
      loadData();
    } catch (error) {
      console.error("Error creating replicas:", error);
      toast.error(error.response?.data?.error || "Failed to create replicas");
    }
  };

  const handleOpenDeleteModal = (chunk) => {
    setChunkToDelete(chunk);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await chunkApi.deleteChunk(chunkToDelete.CHUNK_ID);
      toast.success("Data chunk deleted successfully");
      setDeleteModal(false);
      setChunkToDelete(null);
      loadData();
    } catch (error) {
      console.error("Error deleting chunk:", error);
      toast.error(error.response?.data?.error || "Failed to delete data chunk");
    }
  };

  const handleOpenRelocateModal = (chunk) => {
    setChunkToRelocate(chunk);
    setTargetDriveId("");
    setRelocateModal(true);
  };

  const handleRelocate = async () => {
    try {
      if (!targetDriveId) {
        toast.error("Please select a target drive");
        return;
      }

      await chunkApi.relocateChunk(chunkToRelocate.CHUNK_ID, {
        targetDriveId,
        reason: "Manual relocation",
      });

      toast.success("Data chunk relocation initiated");
      setRelocateModal(false);
      setChunkToRelocate(null);
      setTargetDriveId("");
      loadData();
    } catch (error) {
      console.error("Error relocating chunk:", error);
      toast.error(
        error.response?.data?.error || "Failed to relocate data chunk"
      );
    }
  };

  // Get available healthy drives for relocation excluding the current drive
  const getAvailableDrives = (chunk) => {
    return drives.filter(
      (drive) =>
        drive.STATUS === "HEALTHY" &&
        drive.DRIVE_ID !== chunk?.DRIVE_ID &&
        drive.AVAILABLE_SPACE >= chunk?.SIZE_MB
    );
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Data Chunks Management
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={loadData}
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
            Add Chunk
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Priority
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Drive
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Protection
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : chunks.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No data chunks found
                  </td>
                </tr>
              ) : (
                chunks.map((chunk) => (
                  <tr
                    key={chunk.CHUNK_ID}
                    className={
                      chunk.STATUS === "CORRUPTED" ? "bg-danger-50" : ""
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {chunk.CHUNK_NAME}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(chunk.SIZE_MB / 1024).toFixed(2)} GB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          chunk.PRIORITY >= 4
                            ? "bg-danger-100 text-danger-800"
                            : chunk.PRIORITY === 3
                            ? "bg-warning-100 text-warning-800"
                            : "bg-primary-100 text-primary-800"
                        }`}
                      >
                        {chunk.PRIORITY >= 4
                          ? "High"
                          : chunk.PRIORITY === 3
                          ? "Medium"
                          : "Low"}{" "}
                        ({chunk.PRIORITY})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {chunk.DRIVE_NAME}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={chunk.STATUS} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {chunk.REPLICATED === 1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                          Replicated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Replicas
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenRelocateModal(chunk)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Relocate Chunk"
                          disabled={chunk.STATUS !== "ACTIVE"}
                        >
                          <ArrowDownOnSquareIcon
                            className={`h-5 w-5 ${
                              chunk.STATUS !== "ACTIVE"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleOpenModal(chunk)}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Edit Chunk"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(chunk)}
                          className="text-danger-600 hover:text-danger-900"
                          title="Delete Chunk"
                        >
                          <TrashIcon className="h-5 w-5" />
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

      {/* Add/Edit Chunk Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={
          editChunk
            ? `Edit Data Chunk: ${editChunk.CHUNK_NAME}`
            : "Add New Data Chunk"
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label
                htmlFor="chunkName"
                className="block text-sm font-medium text-gray-700"
              >
                Chunk Name
              </label>
              <input
                type="text"
                name="chunkName"
                id="chunkName"
                required
                value={chunkForm.chunkName}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            {!editChunk && (
              <>
                <div className="sm:col-span-3">
                  <label
                    htmlFor="sizeMb"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Size (MB)
                  </label>
                  <input
                    type="number"
                    name="sizeMb"
                    id="sizeMb"
                    required
                    min="1"
                    value={chunkForm.sizeMb}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="driveId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Drive
                  </label>
                  <select
                    name="driveId"
                    id="driveId"
                    value={chunkForm.driveId}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Automatically Select (Optimal)</option>
                    {drives
                      .filter(
                        (drive) =>
                          drive.STATUS === "HEALTHY" && !drive.IS_BACKUP
                      )
                      .map((drive) => (
                        <option key={drive.DRIVE_ID} value={drive.DRIVE_ID}>
                          {drive.DRIVE_NAME} -{" "}
                          {(drive.AVAILABLE_SPACE / 1024).toFixed(1)} GB
                          available
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for optimal automatic placement
                  </p>
                </div>
              </>
            )}

            <div className="sm:col-span-3">
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700"
              >
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                required
                value={chunkForm.priority}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="1">Low (1)</option>
                <option value="2">Low-Medium (2)</option>
                <option value="3">Medium (3)</option>
                <option value="4">Medium-High (4)</option>
                <option value="5">High (5)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Higher priority data is given preference during redistribution
                events
              </p>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="checksum"
                className="block text-sm font-medium text-gray-700"
              >
                Checksum (Optional)
              </label>
              <input
                type="text"
                name="checksum"
                id="checksum"
                value={chunkForm.checksum}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            {!editChunk && (
              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <input
                    id="replicated"
                    name="replicated"
                    type="checkbox"
                    checked={chunkForm.replicated}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="replicated"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Create replica(s) for this data chunk
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Replicas will be stored on backup drives to ensure data
                  redundancy
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editChunk ? "Update Chunk" : "Create Chunk"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Data Chunk"
        size="sm"
      >
        <div className="text-sm text-gray-500">
          <p>
            Are you sure you want to delete data chunk{" "}
            <span className="font-medium text-gray-700">
              {chunkToDelete?.CHUNK_NAME}
            </span>
            ?
          </p>
          <p className="mt-2">
            This action cannot be undone. This will permanently delete the chunk
            and all its replicas from the system.
          </p>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => setDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" type="button" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Relocate Modal */}
      <Modal
        open={relocateModal}
        onClose={() => setRelocateModal(false)}
        title="Relocate Data Chunk"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Select a target drive to relocate the data chunk{" "}
            <span className="font-medium text-gray-700">
              {chunkToRelocate?.CHUNK_NAME}
            </span>{" "}
            ({(chunkToRelocate?.SIZE_MB / 1024).toFixed(2)} GB).
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="targetDriveId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Target Drive
          </label>
          <select
            name="targetDriveId"
            id="targetDriveId"
            required
            value={targetDriveId}
            onChange={(e) => setTargetDriveId(e.target.value)}
            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select target drive</option>
            {chunkToRelocate &&
              getAvailableDrives(chunkToRelocate).map((drive) => (
                <option key={drive.DRIVE_ID} value={drive.DRIVE_ID}>
                  {drive.DRIVE_NAME} -{" "}
                  {(drive.AVAILABLE_SPACE / 1024).toFixed(1)} GB available
                </option>
              ))}
          </select>
          {chunkToRelocate &&
            getAvailableDrives(chunkToRelocate).length === 0 && (
              <p className="mt-2 text-sm text-danger-600">
                No suitable drives available for relocation. Drives must be
                healthy and have enough space.
              </p>
            )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => setRelocateModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRelocate}
            disabled={
              !targetDriveId || getAvailableDrives(chunkToRelocate).length === 0
            }
          >
            Relocate
          </Button>
        </div>
      </Modal>

      {/* Insufficient Backup Drives Modal */}
      <Modal
        open={insufficientBackupDrivesModal}
        onClose={() => setInsufficientBackupDrivesModal(false)}
        title="Insufficient Backup Drives"
      >
        <div className="text-sm text-gray-500">
          <div className="bg-warning-50 border border-warning-200 rounded-md p-3 mb-3">
            <p className="text-warning-800">
              <span className="font-medium">Not enough backup drives available.</span> The system requires
              {backupDrivesInfo?.required} backup drives for replicas, but only
              {backupDrivesInfo?.available} are available.
            </p>
          </div>

          <p className="mt-3">
            Would you like to proceed with creating {backupDrivesInfo?.available} replicas using the available backup drives?
          </p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setInsufficientBackupDrivesModal(false);
              setPendingChunkId(null);
              setBackupDrivesInfo(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleCreateLimitedReplicas}
          >
            Create {backupDrivesInfo?.available} Replicas
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DataChunks;
