// ShiftStatusChart.jsx
// Donut / pie chart showing shift status breakdown.
// Shows Upcoming, Ongoing, and Completed slices.
// If there is no data in the selected date range, shows an empty message.

import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

// COLORS - one color per slice in order: upcoming, ongoing, completed, etc.
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

// CustomTooltip - styled tooltip for pie chart hover
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-lg">
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.payload.fill }} className="font-medium">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ShiftStatusChart - pie chart for shift status breakdown
//
// Props:
// statusData - array of { name, value } objects
//              each entry is one status slice (Upcoming, Ongoing, Completed)
// loading    - true while data is loading
const ShiftStatusChart = ({ statusData, loading }) => {
  if (loading) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-sm font-semibold text-gray-900">Shift status breakdown</h3>
      <p className="text-xs text-gray-400">Current snapshot from filtered shifts</p>

      <div className="mt-4 w-full">
        {statusData.length > 0 ? (
          <div className="flex min-h-[280px] w-full flex-col">
            {/* Donut chart */}
            <div className="h-[200px] w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend below the chart */}
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, width: "100%", paddingTop: 12 }}
              formatter={(value) => <span className="text-gray-600">{value}</span>}
              payload={statusData.map((d, i) => ({
                value: d.name,
                type:  "circle",
                id:    d.name,
                color: COLORS[i % COLORS.length],
              }))}
            />
          </div>
        ) : (
          /* No data message */
          <div className="flex min-h-[280px] flex-col items-center justify-center text-gray-400">
            <p className="text-sm">No shift status data in this range</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftStatusChart;
