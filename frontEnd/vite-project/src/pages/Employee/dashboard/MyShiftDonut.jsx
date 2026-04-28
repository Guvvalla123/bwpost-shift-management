// MyShiftDonut.jsx
// Donut + legend for shift status breakdown (ongoing, upcoming, needs staff, completed).

import React from "react";
import { DonutChart } from "@/components/ui";

// Row list with optional percent bar (same visual as original DonutLegendRows)
function LegendRows({ rows, total, valueMode = "count" }) {
  const denom = total > 0 ? total : 1;
  return (
    <ul className="w-full space-y-2">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.value / denom) * 100) : 0;
        const barPct = total > 0 ? (row.value / denom) * 100 : 0;
        return (
          <li key={row.name}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate text-sm text-gray-700">{row.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {valueMode === "percent" ? `${pct}%` : row.value}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
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

// MyShiftDonut — card wrapper matching old "My shifts by status" block
//
// Props:
// shiftDonutData - array { name, value, color }
// totalShifts    - numeric center label (`total`)
function MyShiftDonut({ shiftDonutData, totalShifts }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900">My shifts by status</h2>
      <div className="mt-3 flex flex-col items-center">
        <DonutChart
          data={shiftDonutData}
          centerValue={String(totalShifts)}
          centerLabel="total"
          size={120}
        />
        <div className="mt-2 w-full">
          <LegendRows rows={shiftDonutData} total={totalShifts} valueMode="count" />
        </div>
      </div>
    </div>
  );
}

export default MyShiftDonut;
