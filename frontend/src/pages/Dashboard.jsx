import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, metricApi, driveApi } from "../services/api";
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import Button from "../components/ui/Button";
import LoadingState from "../components/ui/LoadingState";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
  CubeIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";

// Mock data for when API returns empty or fails
const MOCK_DATA = {
  systemHealth: {
    OVERALL_HEALTH: "HEALTHY",
    STORAGE_UTILIZATION: 42,
    USED_CAPACITY_GB: 256,
    TOTAL_CAPACITY_GB: 600,
    HEALTHY_DRIVES: 5,
    DEGRADED_DRIVES: 1,
    FAILING_DRIVES: 0,
    FAILED_DRIVES: 0,
    CRITICAL_DRIVES: 0,
    MAINTENANCE_DRIVES: 0,
    FAILING_DRIVES_COUNT: 0,
  },
  dataProtection: {
    PROTECTION_PERCENTAGE: 85,
    PROTECTED_CHUNKS: 42,
    TOTAL_CHUNKS: 50,
  },
  recentRedistributions: [
    {
      LOG_ID: "mock-1",
      REASON: "Initial data distribution",
      CHUNK_NAME: "chunk-5821",
      STATUS: "COMPLETED",
      STARTED_AT: new Date().toISOString(),
    },
    {
      LOG_ID: "mock-2",
      REASON: "Drive performance optimization",
      CHUNK_NAME: "chunk-3842",
      STATUS: "COMPLETED",
      STARTED_AT: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
  ],
  alerts: {
    DRIVES_AT_CAPACITY_RISK: 0,
    DRIVES_WITH_ERRORS: 0,
    UNPROTECTED_CRITICAL_CHUNKS: 2,
    DRIVES_WITH_HIGH_TEMP: 0,
  },
};

// Mock data for charts
const MOCK_DRIVE_HEALTH_DATA = [
  { name: "Healthy", value: 5 },
  { name: "Degraded", value: 1 },
];

const MOCK_STORAGE_DATA = [
  { name: "Used", value: 256 },
  { name: "Available", value: 344 },
];

// Helper function to compute system health based on drive statuses
const computeSystemHealth = (drives) => {
  if (!drives || drives.length === 0) return "UNKNOWN";

  if (drives.some(drive => drive.STATUS === "FAILED" || drive.STATUS === "CRITICAL" || drive.STATUS === "FAILING"))
    return "CRITICAL";
  
  if (drives.some(drive => drive.STATUS === "DEGRADED"))
    return "WARNING";
  
  if (drives.some(drive => drive.STATUS === "WARNING" || drive.STATUS === "MAINTENANCE"))
    return "WARNING";

  return "HEALTHY";
};

// Helper function to process drive status based on utilization
const processDriveStatus = (drive) => {
  const utilizationPercent = ((drive.CAPACITY - drive.AVAILABLE_SPACE) / drive.CAPACITY * 100);
  
  // Only override status if not already in a failure state
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

// Helper function to get drive health summary
const getDriveHealthSummary = (drives) => {
  if (!drives || !drives.length) return { healthy: 0, total: 0, byStatus: {} };
  
  // Count drives by status
  const byStatus = drives.reduce((acc, drive) => {
    acc[drive.STATUS] = (acc[drive.STATUS] || 0) + 1;
    return acc;
  }, {});
  
  // Only count truly HEALTHY drives as healthy
  const healthy = byStatus["HEALTHY"] || 0;
  const total = drives.length;
  
  return {
    healthy,
    total,
    byStatus,
    allHealthy: healthy === total
  };
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [error, setError] = useState(null);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [drives, setDrives] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get data from all required APIs
      const [dashboardRes, healthRes, drivesRes] = await Promise.all([
        dashboardApi.getDashboardSummary(),
        metricApi.getSystemHealth(),
        driveApi.getAllDrives(),
      ]);

      // Process drives to update their status based on utilization
      const processedDrives = drivesRes.data.map(drive => ({
        ...drive,
        STATUS: processDriveStatus(drive)
      }));

      // Get drive health summary
      const driveHealthSummary = getDriveHealthSummary(processedDrives);
      
      // Calculate correct overall system health
      const overallHealth = computeSystemHealth(processedDrives);

      // Count drives by status for chart data
      let healthyCount = 0, degradedCount = 0, warningCount = 0, criticalCount = 0, failingCount = 0, maintenanceCount = 0;
      
      processedDrives.forEach(drive => {
        switch (drive.STATUS) {
          case "HEALTHY": healthyCount++; break;
          case "DEGRADED": degradedCount++; break;
          case "WARNING": warningCount++; break;
          case "CRITICAL": criticalCount++; break;
          case "FAILING": 
          case "FAILED": failingCount++; break;
          case "MAINTENANCE": maintenanceCount++; break;
        }
      });

      // Check if data is empty or contains only null values
      const isDashboardEmpty =
        !dashboardRes.data ||
        (dashboardRes.data.systemHealth &&
          Object.values(dashboardRes.data.systemHealth).every(
            (val) => val === null || val === undefined
          ));

      if (isDashboardEmpty) {
        // Use mock data for demonstration purposes
        setDashboardData({
          ...MOCK_DATA,
          drives: processedDrives,
          driveHealthSummary
        });
        toast.info("Using sample data - Database initialization needed");
      } else {
        // Update system health with corrected values
        const updatedSystemHealth = {
          ...dashboardRes.data.systemHealth,
          OVERALL_HEALTH: overallHealth,
          HEALTHY_DRIVES: healthyCount,
          DEGRADED_DRIVES: degradedCount,
          CRITICAL_DRIVES: criticalCount,
          FAILING_DRIVES: failingCount,
          MAINTENANCE_DRIVES: maintenanceCount
        };

        setDashboardData({
          ...dashboardRes.data,
          systemHealth: updatedSystemHealth,
          drives: processedDrives,
          driveHealthSummary
        });
      }

      setDrives(processedDrives);
      setSystemHealth(healthRes.data || {});
      setDataInitialized(true);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(
        "Failed to load dashboard data. Using sample data for demonstration."
      );
      // Fall back to mock data
      setDashboardData(MOCK_DATA);
      toast.error("Connection error. Using sample data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Refresh every 30 seconds

    setRefreshInterval(interval);

    // Cleanup on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const COLORS = ["#0ea5e9", "#8b5cf6", "#ef4444", "#22c55e", "#f59e0b"];

  // Create pie chart data for drive health
  const driveHealthData = dashboardData?.drives
    ? [
        {
          name: "Healthy",
          value: dashboardData.systemHealth.HEALTHY_DRIVES || 0,
        },
        {
          name: "Degraded",
          value: dashboardData.systemHealth.DEGRADED_DRIVES || 0,
        },
        {
          name: "Critical",
          value: dashboardData.systemHealth.CRITICAL_DRIVES || 0,
        },
        {
          name: "Failing",
          value: dashboardData.systemHealth.FAILING_DRIVES || 0,
        },
        {
          name: "Maintenance",
          value: dashboardData.systemHealth.MAINTENANCE_DRIVES || 0,
        },
      ].filter((item) => item.value > 0)
    : MOCK_DRIVE_HEALTH_DATA;

  // Create bar chart data for storage utilization
  const storageData = dashboardData
    ? [
        {
          name: "Used",
          value: parseFloat(
            dashboardData.systemHealth.USED_CAPACITY_GB || 0
          ).toFixed(2),
        },
        {
          name: "Available",
          value: parseFloat(
            (dashboardData.systemHealth.TOTAL_CAPACITY_GB - 
              dashboardData.systemHealth.USED_CAPACITY_GB) || 0
          ).toFixed(2),
        },
      ]
    : MOCK_STORAGE_DATA;

  const renderHealthStatus = () => {
    if (!dashboardData) return null;

    const healthStatus = dashboardData.systemHealth.OVERALL_HEALTH;

    return (
      <div
        className={`flex items-center p-6 rounded-xl shadow-sm ${
          healthStatus === "HEALTHY"
            ? "bg-gradient-to-r from-success-50 to-success-100 border border-success-200"
            : healthStatus === "WARNING"
            ? "bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200"
            : "bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200"
        }`}
      >
        <div
          className={`rounded-full p-3 ${
            healthStatus === "HEALTHY"
              ? "bg-success-100"
              : healthStatus === "WARNING"
              ? "bg-warning-100"
              : "bg-danger-100"
          }`}
        >
          {healthStatus === "HEALTHY" ? (
            <CheckCircleIcon
              className={`w-9 h-9 ${
                healthStatus === "HEALTHY"
                  ? "text-success-500"
                  : healthStatus === "WARNING"
                  ? "text-warning-500"
                  : "text-danger-500"
              }`}
            />
          ) : healthStatus === "WARNING" ? (
            <ExclamationTriangleIcon className="w-9 h-9 text-warning-500" />
          ) : (
            <ExclamationTriangleIcon className="w-9 h-9 text-danger-500" />
          )}
        </div>

        <div className="ml-5 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Status</h3>
            <StatusBadge status={healthStatus} className="text-sm py-1 px-3" />
          </div>
          <p
            className={`mt-1 ${
              healthStatus === "HEALTHY"
                ? "text-success-700"
                : healthStatus === "WARNING"
                ? "text-warning-700"
                : "text-danger-700"
            }`}
          >
            {healthStatus === "HEALTHY"
              ? "All systems are operating normally."
              : healthStatus === "WARNING"
              ? `Warning: ${dashboardData.systemHealth.DEGRADED_DRIVES || 0} degraded drives detected.`
              : `Critical: ${(dashboardData.systemHealth.CRITICAL_DRIVES || 0) + (dashboardData.systemHealth.FAILING_DRIVES || 0)} critical/failing drives detected.`}
          </p>
          <div className="mt-2">
            <Button
              size="sm"
              variant={
                healthStatus === "HEALTHY"
                  ? "success"
                  : healthStatus === "WARNING"
                  ? "warning"
                  : "danger"
              }
              to="/monitoring"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Data initialization notice
  const renderDataInitNotice = () => {
    if (!error && dataInitialized) return null;

    return (
      <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon
              className="h-5 w-5 text-primary-500"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-primary-700">
              {error ||
                "Sample data is shown. Add drives and data chunks to see actual metrics."}
            </p>
            <p className="mt-3 text-sm md:mt-0 md:ml-6">
              <Button to="/simulation" variant="outline" size="xs">
                Generate Test Data
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overview of your storage system's health and performance
          </p>
        </div>
        <div className="flex space-x-2">
          <span className="text-xs text-slate-500 flex items-center mr-2">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Data initialization notice if needed */}
      {renderDataInitNotice()}

      {/* System Health Status */}
      {loading && !dashboardData ? (
        <div className="mb-6">
          <div className="animate-pulse bg-slate-100 h-24 rounded-xl"></div>
        </div>
      ) : (
        <div className="mb-6">{renderHealthStatus()}</div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card className="dashboard-card col-span-1 hover:translate-y-[-4px] transition-all duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg bg-primary-100 p-3">
              <ServerStackIcon
                className="h-7 w-7 text-primary-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-500">
                  Storage Utilization
                </p>
                <ArrowTrendingUpIcon className="h-4 w-4 text-success-500" />
              </div>
              {loading && !dashboardData ? (
                <div className="animate-pulse h-8 bg-slate-100 rounded w-24 mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-800">
                  {dashboardData
                    ? `${dashboardData.systemHealth.STORAGE_UTILIZATION}%`
                    : "N/A"}
                </p>
              )}
              {loading && !dashboardData ? (
                <div className="animate-pulse h-4 bg-slate-100 rounded w-40 mt-2"></div>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  {dashboardData
                    ? `${parseFloat(
                        dashboardData.systemHealth.USED_CAPACITY_GB
                      ).toFixed(1)} GB / ${parseFloat(
                        dashboardData.systemHealth.TOTAL_CAPACITY_GB
                      ).toFixed(1)} GB used`
                    : ""}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              to="/analytics"
              className="text-primary-600 hover:text-primary-800 text-xs font-medium"
            >
              View Analytics →
            </Link>
          </div>
        </Card>

        <Card className="dashboard-card col-span-1 hover:translate-y-[-4px] transition-all duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg bg-secondary-100 p-3">
              <CpuChipIcon
                className="h-7 w-7 text-secondary-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-500">
                  Data Protection
                </p>
                <ArrowTrendingUpIcon className="h-4 w-4 text-success-500" />
              </div>
              {loading && !dashboardData ? (
                <div className="animate-pulse h-8 bg-slate-100 rounded w-24 mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-800">
                  {dashboardData
                    ? `${dashboardData.dataProtection.PROTECTION_PERCENTAGE}%`
                    : "N/A"}
                </p>
              )}
              {loading && !dashboardData ? (
                <div className="animate-pulse h-4 bg-slate-100 rounded w-40 mt-2"></div>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  {dashboardData
                    ? `${dashboardData.dataProtection.PROTECTED_CHUNKS}/${dashboardData.dataProtection.TOTAL_CHUNKS} chunks protected`
                    : ""}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              to="/chunks"
              className="text-primary-600 hover:text-primary-800 text-xs font-medium"
            >
              View Data Chunks →
            </Link>
          </div>
        </Card>

        <Card className="dashboard-card col-span-1 hover:translate-y-[-4px] transition-all duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg bg-success-100 p-3">
              <ShieldCheckIcon
                className="h-7 w-7 text-success-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-500">
                  Healthy Drives
                </p>
                {dashboardData?.systemHealth?.CRITICAL_DRIVES > 0 || dashboardData?.systemHealth?.FAILING_DRIVES > 0 ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-500"></span>
                  </span>
                ) : 
                dashboardData?.systemHealth?.DEGRADED_DRIVES > 0 ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-warning-500"></span>
                  </span>
                ) : (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-success-500" />
                )}
              </div>
              {loading && !dashboardData ? (
                <div className="animate-pulse h-8 bg-slate-100 rounded w-24 mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-800">
                  {dashboardData
                    ? `${dashboardData.systemHealth.HEALTHY_DRIVES}/${
                        dashboardData.systemHealth.HEALTHY_DRIVES +
                        dashboardData.systemHealth.DEGRADED_DRIVES +
                        dashboardData.systemHealth.CRITICAL_DRIVES +
                        dashboardData.systemHealth.FAILING_DRIVES +
                        dashboardData.systemHealth.FAILED_DRIVES +
                        dashboardData.systemHealth.MAINTENANCE_DRIVES
                      }`
                    : "N/A"}
                </p>
              )}
              {loading && !dashboardData ? (
                <div className="animate-pulse h-4 bg-slate-100 rounded w-40 mt-2"></div>
              ) : (
                <p className={`text-xs ${
                  dashboardData?.systemHealth?.CRITICAL_DRIVES > 0 || 
                  dashboardData?.systemHealth?.FAILING_DRIVES > 0 ? 
                    'text-danger-500 font-medium' : 
                  dashboardData?.systemHealth?.DEGRADED_DRIVES > 0 ?
                    'text-warning-500 font-medium' : 
                    'text-slate-500'} mt-1`}>
                  {dashboardData?.systemHealth?.CRITICAL_DRIVES > 0
                    ? `${dashboardData.systemHealth.CRITICAL_DRIVES} critical drives need attention`
                    : dashboardData?.systemHealth?.FAILING_DRIVES > 0
                    ? `${dashboardData.systemHealth.FAILING_DRIVES} failing drives need attention`
                    : dashboardData?.systemHealth?.DEGRADED_DRIVES > 0
                    ? `${dashboardData.systemHealth.DEGRADED_DRIVES} degraded drives need attention`
                    : "All drives operating normally"}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              to="/drives"
              className="text-primary-600 hover:text-primary-800 text-xs font-medium"
            >
              View Drives →
            </Link>
          </div>
        </Card>
      </div>

      {/* Charts and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Drive Health Distribution */}
        <Card title="Drive Health Distribution" className="col-span-1">
          <div className="h-64">
            {loading && !dashboardData ? (
              <LoadingState />
            ) : driveHealthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={driveHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {driveHealthData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "8px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="bg-slate-100 rounded-full p-4 mb-3">
                  <ChartBarIcon className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">
                  No drive health data available
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Add drives to see distribution
                </p>

                <Button
                  to="/drives"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Add Drives
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Storage Utilization */}
        <Card title="Storage Allocation" className="col-span-1">
          <div className="h-64">
            {loading && !dashboardData ? (
              <LoadingState />
            ) : storageData.some((item) => parseFloat(item.value) > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={storageData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" unit=" GB" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => [`${value} GB`, "Capacity"]} />
                  <Bar
                    dataKey="value"
                    fill="#0ea5e9"
                    radius={[0, 4, 4, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="bg-slate-100 rounded-full p-4 mb-3">
                  <ServerStackIcon className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">
                  No storage data available
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Add some data chunks to see allocation
                </p>

                <Button
                  to="/chunks"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Add Data Chunks
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Events */}
        <Card title="Recent Events" className="col-span-1">
          {loading && !dashboardData ? (
            <div className="space-y-4 h-64">
              <div className="animate-pulse h-16 bg-slate-100 rounded-lg"></div>
              <div className="animate-pulse h-16 bg-slate-100 rounded-lg"></div>
              <div className="animate-pulse h-16 bg-slate-100 rounded-lg"></div>
            </div>
          ) : (
            <div>
              <div className="space-y-4 h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {dashboardData?.recentRedistributions?.length > 0 ? (
                  dashboardData.recentRedistributions.map((event) => (
                    <div
                      key={event.LOG_ID}
                      className="border-l-4 border-primary-500 pl-4 py-3 bg-slate-50 rounded-r-lg shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <p className="text-sm font-medium text-slate-700">
                        <span className="text-primary-600">{event.REASON}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Chunk: {event.CHUNK_NAME || event.CHUNK_ID}
                      </p>
                      <div className="flex justify-between mt-2">
                        <StatusBadge status={event.STATUS} />
                        <span className="text-xs text-slate-400">
                          {new Date(event.STARTED_AT).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="bg-slate-100 rounded-full inline-flex p-4 mb-3">
                      <svg
                        className="h-6 w-6 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">
                      No recent events
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Events will appear when storage changes occur
                    </p>

                    <Button
                      to="/simulation"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Run Simulation
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center border-t border-slate-100 pt-4">
                <Link
                  to="/monitoring"
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center"
                >
                  View all activity
                  <svg
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Start Guide */}
      {(!dashboardData?.recentRedistributions ||
        dashboardData.recentRedistributions.length === 0) && (
        <Card
          title="Quick Start Guide"
          className="mb-6 border-t-4 border-t-primary-500"
        >
          <div className="space-y-6">
            <p className="text-slate-600">
              Welcome to Smart Storage System! Follow these steps to get
              started:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-3">
                  <div className="bg-primary-100 rounded-full p-2 mr-3">
                    <ServerStackIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">
                    1. Add Storage Drives
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Begin by adding storage drives to your system
                </p>
                <Button to="/drives" size="sm" variant="primary">
                  Add Drives
                </Button>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-3">
                  <div className="bg-secondary-100 rounded-full p-2 mr-3">
                    <CubeIcon className="h-5 w-5 text-secondary-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">
                    2. Add Data Chunks
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Upload and organize your data chunks
                </p>
                <Button to="/chunks" size="sm" variant="secondary">
                  Add Chunks
                </Button>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-3">
                  <div className="bg-success-100 rounded-full p-2 mr-3">
                    <BeakerIcon className="h-5 w-5 text-success-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">
                    3. Run Simulations
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Test system resilience with simulated scenarios
                </p>
                <Button to="/simulation" size="sm" variant="success">
                  Start Simulation
                </Button>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center mt-2">
              Need help? Check out the{" "}
              <a href="#" className="text-primary-600 hover:text-primary-800">
                documentation
              </a>{" "}
              or{" "}
              <a href="#" className="text-primary-600 hover:text-primary-800">
                contact support
              </a>
              .
            </p>
          </div>
        </Card>
      )}

      {/* Last updated footer */}
      <div className="text-right text-xs text-slate-400">
        System data last updated: 2025-05-27 16:19:55 UTC
      </div>
    </div>
  );
};

export default Dashboard;