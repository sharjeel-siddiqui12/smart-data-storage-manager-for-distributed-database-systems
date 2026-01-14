import { useState, useEffect } from "react";
import { policyApi, driveApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { toast } from "react-toastify";
import {
  PlusIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline";

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  const [rebalancing, setRebalancing] = useState(false);

  const [policyForm, setPolicyForm] = useState({
    policyName: "",
    minReplicas: 2,
    rebalanceThreshold: 75,
    priorityBasedPlacement: true,
    localityAware: true,
    active: false,
  });

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const res = await policyApi.getAllPolicies();
      setPolicies(res.data);
    } catch (error) {
      console.error("Error loading policies:", error);
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const loadDrives = async () => {
    try {
      const res = await driveApi.getAllDrives();
      setDrives(res.data);
    } catch (error) {
      console.error("Error loading drives:", error);
    }
  };

  const validatePolicyForm = () => {
    // Add this validation for backup drives vs min replicas
    const backupDriveCount = drives.filter(
      (drive) => drive.IS_BACKUP === 1 && drive.STATUS === "HEALTHY"
    ).length;

    if (parseInt(policyForm.minReplicas) > backupDriveCount) {
      return {
        isValid: false,
        message: `Warning: You have set ${policyForm.minReplicas} minimum replicas but only have ${backupDriveCount} backup drives available.`,
      };
    }

    return { isValid: true };
  };

  useEffect(() => {
    loadPolicies();
    loadDrives();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPolicyForm({
      ...policyForm,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value)
          : value,
    });
  };

  const resetForm = () => {
    setPolicyForm({
      policyName: "",
      minReplicas: 2,
      rebalanceThreshold: 75,
      priorityBasedPlacement: true,
      localityAware: true,
      active: false,
    });
    setEditPolicy(null);
  };

  const handleOpenModal = (policy = null) => {
    if (policy) {
      setEditPolicy(policy);
      setPolicyForm({
        policyName: policy.POLICY_NAME,
        minReplicas: policy.MIN_REPLICAS,
        rebalanceThreshold: policy.REBALANCE_THRESHOLD,
        priorityBasedPlacement: policy.PRIORITY_BASED_PLACEMENT === 1,
        localityAware: policy.LOCALITY_AWARE === 1,
        active: policy.ACTIVE === 1,
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
    
    // Perform validation
    const validation = validatePolicyForm();
    if (!validation.isValid) {
      toast.warning(validation.message);
      // Show warning but continue with submission
    }
    
    // Continue with form submission regardless of validation result
    try {
      if (editPolicy) {
        await policyApi.updatePolicy(editPolicy.POLICY_ID, policyForm);
        toast.success("Policy updated successfully");
      } else {
        await policyApi.createPolicy(policyForm);
        toast.success("Policy created successfully");
      }
      handleCloseModal();
      loadPolicies();
    } catch (error) {
      console.error("Error saving policy:", error);
      toast.error(error.response?.data?.error || "Failed to save policy");
    }
  };

  const handleOpenDeleteModal = (policy) => {
    setPolicyToDelete(policy);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await policyApi.deletePolicy(policyToDelete.POLICY_ID);
      toast.success("Policy deleted successfully");
      setDeleteModal(false);
      setPolicyToDelete(null);
      loadPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error(error.response?.data?.error || "Failed to delete policy");
    }
  };

  const handleActivatePolicy = async (policyId) => {
    try {
      await policyApi.updatePolicy(policyId, { active: true });
      toast.success("Policy activated successfully");
      loadPolicies();
    } catch (error) {
      console.error("Error activating policy:", error);
      toast.error(error.response?.data?.error || "Failed to activate policy");
    }
  };

  const handleTriggerRebalancing = async () => {
    try {
      setRebalancing(true);
      await policyApi.triggerRebalancing();
      toast.success("Data rebalancing initiated successfully");

      // Simulate rebalancing time before refreshing
      setTimeout(() => {
        loadPolicies();
        setRebalancing(false);
      }, 2000);
    } catch (error) {
      console.error("Error triggering rebalancing:", error);
      toast.error(
        error.response?.data?.error || "Failed to trigger rebalancing"
      );
      setRebalancing(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Distribution Policies
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={loadPolicies}
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
            Add Policy
          </Button>
        </div>
      </div>

      {/* Rebalance Card */}
      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Data Distribution Rebalancing
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manually trigger data redistribution according to the active
              policy. This will optimize storage utilization across all drives.
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<ArrowPathRoundedSquareIcon className="w-5 h-5" />}
            onClick={handleTriggerRebalancing}
            disabled={rebalancing || loading}
          >
            {rebalancing ? "Rebalancing..." : "Trigger Rebalancing"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Policy Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Min Replicas
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rebalance Threshold
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Features
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
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
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No policies found
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr
                    key={policy.POLICY_ID}
                    className={policy.ACTIVE === 1 ? "bg-primary-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {policy.POLICY_NAME}
                      {policy.ACTIVE === 1 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.MIN_REPLICAS}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.REBALANCE_THRESHOLD}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {policy.PRIORITY_BASED_PLACEMENT === 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-800">
                            Priority Based
                          </span>
                        )}
                        {policy.LOCALITY_AWARE === 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800 ml-1">
                            Locality Aware
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {policy.ACTIVE === 1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {policy.ACTIVE !== 1 && (
                          <button
                            onClick={() =>
                              handleActivatePolicy(policy.POLICY_ID)
                            }
                            className="text-success-600 hover:text-success-900"
                            title="Activate Policy"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(policy)}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Edit Policy"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {policy.ACTIVE !== 1 && (
                          <button
                            onClick={() => handleOpenDeleteModal(policy)}
                            className="text-danger-600 hover:text-danger-900"
                            title="Delete Policy"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Policy Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={
          editPolicy
            ? `Edit Policy: ${editPolicy.POLICY_NAME}`
            : "Add New Policy"
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label
                htmlFor="policyName"
                className="block text-sm font-medium text-gray-700"
              >
                Policy Name
              </label>
              <input
                type="text"
                name="policyName"
                id="policyName"
                required
                value={policyForm.policyName}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="minReplicas"
                className="block text-sm font-medium text-gray-700"
              >
                Minimum Replicas
              </label>
              <input
                type="number"
                name="minReplicas"
                id="minReplicas"
                required
                min="1"
                max="5"
                value={policyForm.minReplicas}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of replicas to create for each data chunk
              </p>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="rebalanceThreshold"
                className="block text-sm font-medium text-gray-700"
              >
                Rebalance Threshold (%)
              </label>
              <input
                type="number"
                name="rebalanceThreshold"
                id="rebalanceThreshold"
                required
                min="50"
                max="95"
                value={policyForm.rebalanceThreshold}
                onChange={handleInputChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Utilization percentage that triggers rebalancing
              </p>
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center">
                <input
                  id="priorityBasedPlacement"
                  name="priorityBasedPlacement"
                  type="checkbox"
                  checked={policyForm.priorityBasedPlacement}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="priorityBasedPlacement"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Priority-Based Placement
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Prioritize placement of high-priority data on reliable drives
              </p>
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center">
                <input
                  id="localityAware"
                  name="localityAware"
                  type="checkbox"
                  checked={policyForm.localityAware}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="localityAware"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Locality-Aware Distribution
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Consider physical location when distributing data
              </p>
            </div>

            <div className="sm:col-span-6">
              <div className="flex items-center">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  checked={policyForm.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Set as Active Policy
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Only one policy can be active at a time. Setting this as active
                will deactivate all other policies.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editPolicy ? "Update Policy" : "Create Policy"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Policy"
        size="sm"
      >
        <div className="text-sm text-gray-500">
          <p>
            Are you sure you want to delete the policy{" "}
            <span className="font-medium text-gray-700">
              {policyToDelete?.POLICY_NAME}
            </span>
            ?
          </p>
          <p className="mt-2">This action cannot be undone.</p>
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
    </div>
  );
};

export default Policies;
