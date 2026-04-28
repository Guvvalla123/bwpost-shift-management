// StaffPresenceDonut.jsx
// Donut chart showing today's staff attendance breakdown.
// Segments: On time, Late, Absent.
// Center shows the on-time percentage.
// Shows a legend with percentages and mini progress bars below.

import React from "react";
import { DonutChart } from "@/components/ui";

// DonutLegendRows - legend with colored dots, labels, and percentage progress bars
// rows  - array of { name, value, color } objects
// total - sum of all values (used to calculate percentages)
function DonutLegendRows({ rows, total }) {
  const denom = total > 0 ? total : 1;
  return (
    <ul className="w-full space-y-2">
      {rows.map((row) => {
        const pct    = total > 0 ? Math.round((row.value / denom) * 100) : 0;
        const barPct = total > 0 ? (row.value / denom) * 100 : 0;
        return (
          <li key={row.name} className="w-full">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate text-sm text-gray-700">{row.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {pct}%
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${barPct}%`, backgroundColor: row.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// StaffPresenceDonut - donut chart + legend for staff attendance
//
// Props:
// donutData      - array of { name, value, color } already computed in ManagerDashboard
//                  expected: [{ On time }, { Late }, { Absent }]
// onTimeRate     - percentage (0-100) shown in the donut center
// attendanceTotal - sum of all attendance counts (for legend percentages)
const StaffPresenceDonut = ({ donutData, onTimeRate, attendanceTotal }) => {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900">Staff presence</h2>
      <div className="mt-3 flex flex-col items-center">
        <DonutChart
          data={donutData}
          centerValue={`${onTimeRate}%`}
          centerLabel="on time"
          size={120}
        />
        <div className="mt-2 w-full">
          <DonutLegendRows rows={donutData} total={attendanceTotal} />
        </div>
      </div>
    </div>
  );
};

export default StaffPresenceDonut;
