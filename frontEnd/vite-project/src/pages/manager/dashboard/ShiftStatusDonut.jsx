// ShiftStatusDonut.jsx
// Donut chart showing the breakdown of shifts by status.
// Segments: Ongoing, Upcoming, Needs Staff, Completed.
// Shows a legend with progress bars below the donut.

import React from "react";
import { DonutChart } from "@/components/ui";

// SHIFT_STATUS_COLORS - one color per segment
const SHIFT_STATUS_COLORS = {
  ongoing:   "#059669",
  upcoming:  "#1B3F8B",
  needsStaff: "#f59e0b",
  completed: "#d1d5db",
};

// DonutLegendRows - legend list with colored dots, labels, and mini progress bars
// rows  - array of { name, value, color } objects
// total - sum of all values (used to calculate percentages)
function DonutLegendRows({ rows, total }) {
  const denom = total > 0 ? total : 1;
  return (
    <ul className="w-full space-y-2">
      {rows.map((row) => {
        const barPct = total > 0 ? (row.value / denom) * 100 : 0;
        return (
          <li key={row.name} className="w-full">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate text-sm text-gray-700">{row.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {row.value}
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

// ShiftStatusDonut - donut chart + legend for shift status breakdown
//
// Props:
// donutData      - array of { name, value, color } already computed in ManagerDashboard
// totalShiftCount - total number of shifts (shown in donut center)
const ShiftStatusDonut = ({ donutData, totalShiftCount }) => {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900">Shifts by status</h2>
      <div className="mt-3 flex flex-col items-center">
        <DonutChart
          data={donutData}
          centerValue={String(totalShiftCount)}
          centerLabel="total"
          size={120}
        />
        <div className="mt-2 w-full">
          <DonutLegendRows rows={donutData} total={totalShiftCount} />
        </div>
      </div>
    </div>
  );
};

export default ShiftStatusDonut;
