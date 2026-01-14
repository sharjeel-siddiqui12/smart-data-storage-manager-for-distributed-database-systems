import { useState, useEffect } from "react";
import { dashboardApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  ChartPieIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [allocationData, setAllocationData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [events, setEvents] = useState([]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [allocationRes, recommendationsRes, eventsRes] = await Promise.all([
        dashboardApi.getDriveAllocationAnalysis(),
        dashboardApi.getOptimizationRecommendations(),
        dashboardApi.getEventTimeline(50),
      ]);

      setAllocationData(allocationRes.data);
      setRecommendations(recommendationsRes.data.recommendations || []);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error("Error loading analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Chart colors
  const COLORS = [
    "#0ea5e9",
    "#8b5cf6",
    "#ef4444",
    "#22c55e",
    "#f59e0b",
    "#6366f1",
    "#ec4899",
    "#14b8a6",
  ];

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Storage Analytics
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowPathIcon className="w-4 h-4" />}
            onClick={loadAnalyticsData}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Storage Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Drive Utilization Analysis">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : allocationData?.drives ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={allocationData.drives.slice(0, 10)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="DRIVE_NAME"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{
                      value: "Utilization %",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }}
                    domain={[0, 100]}
                  />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar
                    dataKey="UTILIZATION_PERCENT"
                    name="Utilization %"
                    fill="#0ea5e9"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">
                No drive utilization data available
              </p>
            </div>
          )}
        </Card>

        <Card title="Data Distribution by Location">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : allocationData?.locationDistribution ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={allocationData.locationDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="TOTAL_CAPACITY"
                  >
                    {allocationData.locationDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${(value / 1048576).toFixed(2)} TB`}
                    labelFormatter={(label) => `Location: ${label}`}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const item = entry.payload;
                      return `${item.LOCATION} (${
                        item.DRIVE_COUNT || 0
                      } drives)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center">
              <ChartPieIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No location data available</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Drive Type Distribution">
          {loading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : allocationData?.driveTypeDistribution ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={allocationData.driveTypeDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="DRIVE_TYPE" type="category" width={70} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar
                    dataKey="UTILIZATION_PERCENT"
                    name="Utilization %"
                    fill="#8b5cf6"
                  />
                  <Bar
                    dataKey="CAPACITY_PERCENTAGE"
                    name="Capacity %"
                    fill="#0ea5e9"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No drive type data available</p>
            </div>
          )}
        </Card>

        <Card title="Data Chunks by Priority">
          {loading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : allocationData?.priorityDistribution ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={allocationData.priorityDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="PRIORITY"
                    label={{
                      value: "Priority Level",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="CHUNK_COUNT"
                    name="Chunk Count"
                    fill="#0ea5e9"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="PROTECTION_PERCENTAGE"
                    name="Protection %"
                    fill="#8b5cf6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No priority data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      <Card title="Optimization Recommendations" className="mb-5">
        {loading ? (
          <div className="py-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-success-600 font-medium">
              No optimization recommendations at this time. Your storage system
              is well-balanced.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  rec.priority === "HIGH"
                    ? "bg-warning-50 border-warning-200"
                    : rec.priority === "MEDIUM"
                    ? "bg-primary-50 border-primary-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-2">
                  {rec.description}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>

                {rec.affected_items &&
                  rec.affected_items.length > 0 &&
                  rec.type === "REBALANCE" && (
                    <div className="bg-white p-3 rounded overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Drive Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Utilization
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rec.affected_items
                            .slice(0, 5)
                            .map((item, itemIndex) => (
                              <tr
                                key={itemIndex}
                                className={
                                  itemIndex % 2 === 0 ? "bg-gray-50" : ""
                                }
                              >
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.DRIVE_NAME}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.UTILIZATION_PERCENT}%
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {rec.affected_items.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          And {rec.affected_items.length - 5} more items...
                        </p>
                      )}
                    </div>
                  )}

                {rec.affected_items &&
                  rec.affected_items.length > 0 &&
                  rec.type === "PROTECT" && (
                    <div className="bg-white p-3 rounded overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Chunk Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Priority
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Size
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rec.affected_items
                            .slice(0, 5)
                            .map((item, itemIndex) => (
                              <tr
                                key={itemIndex}
                                className={
                                  itemIndex % 2 === 0 ? "bg-gray-50" : ""
                                }
                              >
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.CHUNK_NAME}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.PRIORITY}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {(item.SIZE_MB / 1024).toFixed(2)} GB
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {rec.affected_items.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          And {rec.affected_items.length - 5} more items...
                        </p>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Event Timeline */}
      <Card title="System Event Timeline">
        {loading ? (
          <div className="py-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No events recorded</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline center line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200"></div>

            <div className="space-y-8 py-6 relative">
              {events.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-start relative ${
                    index % 2 === 0 ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -mt-1 w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow"></div>

                  {/* Content */}
                  <div
                    className={`w-5/12 p-4 rounded-lg shadow-sm border border-gray-200 bg-white ${
                      index % 2 === 0 ? "mr-8" : "ml-8"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">
                        {event.EVENT_TYPE.replace("_", " ")}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(event.EVENT_TIME).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {event.EVENT_DESCRIPTION}
                    </p>
                    {event.EVENT_REASON && (
                      <p className="mt-1 text-xs text-gray-500">
                        Reason: {event.EVENT_REASON}
                      </p>
                    )}
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          event.EVENT_STATUS === "COMPLETED"
                            ? "bg-success-100 text-success-800"
                            : event.EVENT_STATUS === "FAILED"
                            ? "bg-danger-100 text-danger-800"
                            : event.EVENT_STATUS === "HEALTHY"
                            ? "bg-success-100 text-success-800"
                            : event.EVENT_STATUS === "DEGRADED"
                            ? "bg-warning-100 text-warning-800"
                            : event.EVENT_STATUS === "FAILING" ||
                              event.EVENT_STATUS === "FAILED"
                            ? "bg-danger-100 text-danger-800"
                            : "bg-primary-100 text-primary-800"
                        }`}
                      >
                        {event.EVENT_STATUS}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {events.length > 0 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info("Feature not implemented in this demo")
                  }
                >
                  Load More Events
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Analytics;
