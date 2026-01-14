import { useState, useEffect } from "react";
import { metricApi, driveApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper function to determine drive status based on utilization
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

const Monitoring = () => {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [driveMetrics, setDriveMetrics] = useState([]);
  const [redistributionHistory, setRedistributionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [selectedMetricType, setSelectedMetricType] = useState("cpu_usage");
  const [drives, setDrives] = useState([]);

  // Add this function to get appropriate units for each metric type
  const getMetricUnit = (metricType) => {
    const metricUnits = {
      cpu_usage: "%",
      io_throughput: "MB/s",
      response_time: "ms",
      error_rate: "%",
      temperature: "°C",
      utilization_percent: "%",
    };
    return metricUnits[metricType] || "";
  };

  // Rest of your component code remains the same
  // ...

  const loadData = async () => {
    try {
      setLoading(true);
      const [systemRes, drivesRes, redistributionRes, allDrivesRes] = await Promise.all([
        metricApi.getSystemMetrics(),
        metricApi.getDrivePerformanceMetrics(timeRange),
        metricApi.getRedistributionHistory(50),
        driveApi.getAllDrives()
      ]);

      // Process all drives to get accurate status
      const processedDrives = allDrivesRes.data.map(drive => ({
        ...drive,
        STATUS: processDriveStatus(drive)
      }));

      // Count drive health statuses
      let healthyCount = 0, degradedCount = 0, warningCount = 0, 
          criticalCount = 0, failingCount = 0, failedCount = 0, maintenanceCount = 0;
      
      processedDrives.forEach(drive => {
        switch(drive.STATUS) {
          case "HEALTHY": healthyCount++; break;
          case "DEGRADED": degradedCount++; break;
          case "WARNING": warningCount++; break;
          case "CRITICAL": criticalCount++; break;
          case "FAILING": failingCount++; break;
          case "FAILED": failedCount++; break;
          case "MAINTENANCE": maintenanceCount++; break;
        }
      });

      // Update system metrics with corrected drive health counts
      const updatedSystemMetrics = {
        ...systemRes.data,
        drives: {
          ...systemRes.data.drives,
          HEALTHY_DRIVES: healthyCount,
          DEGRADED_DRIVES: degradedCount,
          WARNING_DRIVES: warningCount,
          CRITICAL_DRIVES: criticalCount,
          FAILING_DRIVES: failingCount,
          FAILED_DRIVES: failedCount,
          MAINTENANCE_DRIVES: maintenanceCount
        }
      };

      setDrives(processedDrives);
      setSystemMetrics(updatedSystemMetrics);
      setDriveMetrics(drivesRes.data);
      setRedistributionHistory(redistributionRes.data);
    } catch (error) {
      console.error("Error loading monitoring data:", error);
      toast.error("Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      loadData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [timeRange]);

  const handleTimeRangeChange = (hours) => {
    setTimeRange(hours);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Prepare chart data
  // Fix the prepareChartData function
  const prepareChartData = () => {
    if (!driveMetrics || driveMetrics.length === 0) return [];

    const metricMap = {};

    driveMetrics.forEach((drive) => {
      // Add debug logging to see the actual structure of drive data
      console.log("Drive data structure:", drive);

      if (
        drive.metrics &&
        Array.isArray(drive.metrics) &&
        drive.metrics.length > 0
      ) {
        drive.metrics.forEach((metric) => {
          // Add debug logging for metric structure
          console.log("Metric structure:", metric);

          const timestamp = new Date(
            metric.RECORDED_AT || metric.recorded_at
          ).getTime();
          if (!metricMap[timestamp]) {
            metricMap[timestamp] = {
              timestamp,
              formattedTime: new Date(
                metric.RECORDED_AT || metric.recorded_at
              ).toLocaleTimeString(),
            };
          }

          // Be more flexible with property names (check both case versions)
          const metricValue =
            metric[selectedMetricType.toUpperCase()] ||
            metric[selectedMetricType.toLowerCase()] ||
            metric[selectedMetricType] ||
            0;

          // Add this drive's metric to the timestamp entry
          metricMap[timestamp][`${drive.drive_id}_${selectedMetricType}`] =
            metricValue;
          metricMap[timestamp][`${drive.drive_id}_name`] =
            drive.drive_name || drive.DRIVE_NAME;
        });
      } else {
        console.warn(
          `Drive ${drive.drive_id} has no metrics or invalid metrics structure`
        );
      }
    });

    // Convert map to array and sort by timestamp
    return Object.values(metricMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  const getMetricDisplayName = (metricType) => {
    const metricNames = {
      cpu_usage: "CPU Usage (%)",
      io_throughput: "I/O Throughput (MB/s)",
      response_time: "Response Time (ms)",
      error_rate: "Error Rate (%)",
      temperature: "Temperature (°C)",
      utilization_percent: "Utilization (%)",
    };
    return metricNames[metricType] || metricType;
  };

  // Generate random colors for chart lines
  const generateLineColor = (index) => {
    const colors = [
      "#0ea5e9",
      "#8b5cf6",
      "#22c55e",
      "#ef4444",
      "#f59e0b",
      "#64748b",
    ];
    return colors[index % colors.length];
  };

  // Get total number of drives
  const getTotalDrives = () => {
    if (!systemMetrics || !systemMetrics.drives) return 0;
    
    return (
      (systemMetrics.drives.HEALTHY_DRIVES || 0) +
      (systemMetrics.drives.DEGRADED_DRIVES || 0) +
      (systemMetrics.drives.WARNING_DRIVES || 0) +
      (systemMetrics.drives.CRITICAL_DRIVES || 0) +
      (systemMetrics.drives.FAILING_DRIVES || 0) +
      (systemMetrics.drives.FAILED_DRIVES || 0) +
      (systemMetrics.drives.MAINTENANCE_DRIVES || 0)
    );
  };

  // Create a descriptive health status text
  const getDriveHealthStatusText = () => {
    if (!systemMetrics || !systemMetrics.drives) return "Loading drive data...";

    const totalDrives = getTotalDrives();

    if (systemMetrics.drives.HEALTHY_DRIVES === totalDrives) {
      return `All ${totalDrives} drives are healthy`;
    }

    let statusText = `Healthy out of ${totalDrives} total drives`;

    // Add detail about problem drives
    const nonHealthyDetails = [];
    if (systemMetrics.drives.CRITICAL_DRIVES > 0) {
      nonHealthyDetails.push(`${systemMetrics.drives.CRITICAL_DRIVES} critical`);
    }
    if (systemMetrics.drives.FAILING_DRIVES > 0) {
      nonHealthyDetails.push(`${systemMetrics.drives.FAILING_DRIVES} failing`);
    }
    if (systemMetrics.drives.FAILED_DRIVES > 0) {
      nonHealthyDetails.push(`${systemMetrics.drives.FAILED_DRIVES} failed`);
    }
    if (systemMetrics.drives.DEGRADED_DRIVES > 0) {
      nonHealthyDetails.push(`${systemMetrics.drives.DEGRADED_DRIVES} degraded`);
    }
    if (systemMetrics.drives.WARNING_DRIVES > 0) {
      nonHealthyDetails.push(`${systemMetrics.drives.WARNING_DRIVES} warning`);
    }
    
    if (nonHealthyDetails.length > 0) {
      return `${systemMetrics.drives.HEALTHY_DRIVES} ${statusText} (${nonHealthyDetails.join(', ')})`;
    }
    
    return `${systemMetrics.drives.HEALTHY_DRIVES} ${statusText}`;
  };

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          System Monitoring
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
        </div>
      </div>

      {/* System Overview */}
      <Card title="System Overview" className="mb-5">
        {loading && !systemMetrics ? (
          <div className="py-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : systemMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">
                Storage Utilization
              </h4>
              <p className="mt-1 text-2xl font-semibold">
                {systemMetrics.drives?.UTILIZATION_PERCENT || 0}%
              </p>
              <p className="text-sm text-gray-500">
                {parseFloat(
                  systemMetrics.drives?.TOTAL_USED_SPACE / 1024
                ).toFixed(1)}{" "}
                /{" "}
                {parseFloat(
                  systemMetrics.drives?.TOTAL_CAPACITY / 1024
                ).toFixed(1)}{" "}
                GB used
              </p>
            </div>

            <div className={`p-4 rounded-lg ${
              systemMetrics.drives?.CRITICAL_DRIVES > 0 || 
              systemMetrics.drives?.FAILING_DRIVES > 0 || 
              systemMetrics.drives?.FAILED_DRIVES > 0 ? 
                'bg-danger-50' : 
              systemMetrics.drives?.DEGRADED_DRIVES > 0 ?
                'bg-warning-50' :
                'bg-gray-50'
            }`}>
              <h4 className="text-sm font-medium text-gray-500">
                Drive Health
              </h4>
              <div className="flex items-center">
                <p className="mt-1 text-2xl font-semibold">
                  {systemMetrics.drives?.HEALTHY_DRIVES || 0}
                </p>
                {(systemMetrics.drives?.CRITICAL_DRIVES > 0 ||
                  systemMetrics.drives?.FAILING_DRIVES > 0) && (
                  <span className="relative flex h-3 w-3 ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-500"></span>
                  </span>
                )}
              </div>
              <p className={`text-sm ${
                systemMetrics.drives?.CRITICAL_DRIVES > 0 || 
                systemMetrics.drives?.FAILING_DRIVES > 0 ? 
                  'text-danger-600 font-medium' : 
                systemMetrics.drives?.DEGRADED_DRIVES > 0 ?
                  'text-warning-600 font-medium' :
                  'text-gray-500'
              }`}>
                {getDriveHealthStatusText()}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Data Chunks</h4>
              <p className="mt-1 text-2xl font-semibold">
                {systemMetrics.chunks?.TOTAL_CHUNKS || 0}
              </p>
              <p className="text-sm text-gray-500">
                {parseFloat(systemMetrics.chunks?.TOTAL_SIZE / 1024).toFixed(1)}{" "}
                GB total data
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">
                Redistributions (24h)
              </h4>
              <p className="mt-1 text-2xl font-semibold">
                {systemMetrics.redistributions?.TOTAL_REDISTRIBUTIONS || 0}
              </p>
              <p className="text-sm text-gray-500">
                {systemMetrics.redistributions?.ONGOING_REDISTRIBUTIONS || 0}{" "}
                ongoing operations
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">
            Failed to load system metrics
          </p>
        )}
      </Card>

      {/* Performance Metrics Chart */}
      <Card
        title="Drive Performance Metrics"
        className="mb-5"
        headerAction={
          <div className="flex space-x-2 items-center text-sm">
            <label htmlFor="metricType" className="text-gray-700">
              Metric:
            </label>
            <select
              id="metricType"
              value={selectedMetricType}
              onChange={(e) => setSelectedMetricType(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            >
              <option value="cpu_usage">CPU Usage</option>
              <option value="io_throughput">I/O Throughput</option>
              <option value="response_time">Response Time</option>
              <option value="error_rate">Error Rate</option>
              <option value="temperature">Temperature</option>
              <option value="utilization_percent">Utilization</option>
            </select>

            <span className="ml-4 text-gray-700">Time Range:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleTimeRangeChange(6)}
                className={`px-2 py-1 text-xs font-medium rounded ${
                  timeRange === 6
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                6h
              </button>
              <button
                onClick={() => handleTimeRangeChange(24)}
                className={`px-2 py-1 text-xs font-medium rounded ${
                  timeRange === 24
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                24h
              </button>
              <button
                onClick={() => handleTimeRangeChange(72)}
                className={`px-2 py-1 text-xs font-medium rounded ${
                  timeRange === 72
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                3d
              </button>
            </div>
          </div>
        }
      >
        <div className="h-80">
          {loading && driveMetrics.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : driveMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={prepareChartData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    // Extract drive ID more reliably by taking everything before the last underscore
                    const driveParts = name.split("_");
                    const metricType = driveParts.pop(); // Remove the metric type (last part)
                    const driveId = driveParts.join("_"); // Rejoin any remaining parts (in case drive_id contains underscores)

                    // Find the matching drive record
                    const drive = driveMetrics.find(
                      (d) => d.drive_id === driveId || d.DRIVE_ID === driveId
                    );
                    return [
                      `${value} ${getMetricUnit(selectedMetricType)}`,
                      drive
                        ? drive.drive_name || drive.DRIVE_NAME || driveId
                        : driveId,
                    ];
                  }}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                {driveMetrics.map((drive, index) => (
                  <Line
                    key={drive.drive_id}
                    type="monotone"
                    dataKey={`${drive.drive_id}_${selectedMetricType}`}
                    name={drive.drive_name || drive.drive_id}
                    stroke={generateLineColor(index)}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No metrics data available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Redistribution History */}
      <Card title="Redistribution History" className="mb-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data Chunk
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Source Drive
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Target Drive
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reason
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && redistributionHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : redistributionHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No redistribution events found
                  </td>
                </tr>
              ) : (
                redistributionHistory.map((event) => (
                  <tr
                    key={event.LOG_ID}
                    className={event.STATUS === "FAILED" ? "bg-danger-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.STARTED_AT)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.CHUNK_NAME || event.CHUNK_ID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.SOURCE_DRIVE_NAME ||
                        event.SOURCE_DRIVE_ID ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.TARGET_DRIVE_NAME || event.TARGET_DRIVE_ID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.REASON}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={event.STATUS} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Health Alerts */}
      <Card title="System Health Alerts">
        {loading ? (
          <div className="py-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          systemMetrics && (
            <div>
              {systemMetrics.drives?.CRITICAL_DRIVES > 0 && (
                <div className="flex items-start p-4 mb-3 bg-danger-50 border border-danger-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-danger-800">
                      {systemMetrics.drives.CRITICAL_DRIVES} drive(s) at critical capacity
                    </h4>
                    <p className="mt-1 text-sm text-danger-700">
                      Drives have reached capacity limits. Immediate data redistribution is required.
                    </p>
                  </div>
                </div>
              )}

              {systemMetrics.drives?.FAILED_DRIVES > 0 && (
                <div className="flex items-start p-4 mb-3 bg-danger-50 border border-danger-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-danger-800">
                      {systemMetrics.drives.FAILED_DRIVES} drive(s) have failed
                    </h4>
                    <p className="mt-1 text-sm text-danger-700">
                      Data has been redistributed to backup drives. Replace
                      failed hardware as soon as possible.
                    </p>
                  </div>
                </div>
              )}

              {systemMetrics.drives?.FAILING_DRIVES > 0 && (
                <div className="flex items-start p-4 mb-3 bg-warning-50 border border-warning-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-warning-800">
                      {systemMetrics.drives.FAILING_DRIVES} drive(s) showing
                      signs of failure
                    </h4>
                    <p className="mt-1 text-sm text-warning-700">
                      Proactive data redistribution has been initiated. Plan for
                      drive replacement.
                    </p>
                  </div>
                </div>
              )}

              {systemMetrics.drives?.DEGRADED_DRIVES > 0 && (
                <div className="flex items-start p-4 mb-3 bg-warning-50 border border-warning-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-warning-800">
                      {systemMetrics.drives.DEGRADED_DRIVES} drive(s) in degraded state
                    </h4>
                    <p className="mt-1 text-sm text-warning-700">
                      Drives are nearing capacity limits. Consider rebalancing data.
                    </p>
                  </div>
                </div>
              )}

              {systemMetrics.chunks?.CORRUPTED_CHUNKS > 0 && (
                <div className="flex items-start p-4 mb-3 bg-warning-50 border border-warning-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-warning-800">
                      {systemMetrics.chunks.CORRUPTED_CHUNKS} corrupted data
                      chunks detected
                    </h4>
                    <p className="mt-1 text-sm text-warning-700">
                      Recovery from replicas is needed. Visit the Simulation
                      page to recover corrupted chunks.
                    </p>
                  </div>
                </div>
              )}

              {systemMetrics.chunks?.REDISTRIBUTING_CHUNKS > 0 && (
                <div className="flex items-start p-4 mb-3 bg-primary-50 border border-primary-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-primary-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-primary-800">
                      {systemMetrics.chunks.REDISTRIBUTING_CHUNKS} data chunks
                      currently redistributing
                    </h4>
                    <p className="mt-1 text-sm text-primary-700">
                      Data migration in progress. Monitor system performance
                      during this operation.
                    </p>
                  </div>
                </div>
              )}

              {systemMetrics.drives?.CRITICAL_DRIVES === 0 &&
                systemMetrics.drives?.FAILED_DRIVES === 0 &&
                systemMetrics.drives?.FAILING_DRIVES === 0 &&
                systemMetrics.drives?.DEGRADED_DRIVES === 0 &&
                systemMetrics.chunks?.CORRUPTED_CHUNKS === 0 &&
                systemMetrics.chunks?.REDISTRIBUTING_CHUNKS === 0 && (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-success-600 font-medium">
                      All systems are operating normally. No alerts to display.
                    </p>
                  </div>
                )}
            </div>
          )
        )}
      </Card>
      
      <div className="text-right text-xs text-gray-400">
        Last updated: {new Date().toLocaleString()} | User: sharjeel-siddiqui12
      </div>
    </div>
  );
};

export default Monitoring;