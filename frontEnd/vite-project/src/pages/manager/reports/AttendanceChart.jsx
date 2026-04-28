// AttendanceChart.jsx
// Shows two time-series charts using the monthly shift data:
//   1. Line chart: attendance/completion RATE over the last 6 months
//   2. Bar chart: total SHIFT COUNT per month over the last 6 months
//
// Both charts share the same monthly data computed in ReportsPage.

import React from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// CustomTooltip - styled tooltip shown on chart hover
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// AttendanceChart - two side-by-side charts for attendance rate and shift volume
//
// Props:
// monthlyData - array of { month, shifts, rate } objects
//               one entry per month for the last 6 months
// loading     - true while data is loading (shows nothing)
const AttendanceChart = ({ monthlyData, loading }) => {
  if (loading) return null;

  return (
    <>
      {/* ── Line chart: Attendance rate over time ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900">Attendance rate over time</h3>
        <p className="text-xs text-gray-400">Completion ratio by month (last 6 months)</p>
        <div className="mt-4 min-h-[280px] w-full">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                name="Rate"
                stroke="#1B3F8B"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bar chart: Shifts per month ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900">Shifts per month</h3>
        <p className="text-xs text-gray-400">Volume in the rolling six-month window</p>
        <div className="mt-4 min-h-[280px] w-full">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="shifts" name="Shifts" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default AttendanceChart;
