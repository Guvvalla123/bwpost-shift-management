// MyAttendanceDonut.jsx
// Donut + legend for on-time vs late vs absent (same placeholders as original).

import React from "react";
import { DonutChart } from "@/components/ui";

function LegendRows({ rows, total, valueMode = "percent" }) {
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

// MyAttendanceDonut — keeps same colors and center label as original mock
//
// Props:
// onTimeCount, lateCount, absentCount — raw counts (original used 0 placeholders)
// attendanceRatePct — string or number for center (e.g. "0%")
function MyAttendanceDonut({ onTimeCount, lateCount, absentCount, attendanceRatePct }) {
  const attendanceDonutData = [
    { name: "On time", value: onTimeCount, color: "#1B3F8B" },
    { name: "Late", value: lateCount, color: "#f59e0b" },
    { name: "Absent", value: absentCount, color: "#ef4444" },
  ];
  const attendanceTotal = onTimeCount + lateCount + absentCount;
  const attendanceRows = attendanceDonutData.map((d) => ({ ...d }));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900">My attendance</h2>
      <div className="mt-3 flex flex-col items-center">
        <DonutChart
          data={attendanceDonutData}
          centerValue={`${attendanceRatePct}%`}
          centerLabel="on time"
          size={120}
        />
        <div className="mt-2 w-full">
          <LegendRows rows={attendanceRows} total={attendanceTotal} valueMode="percent" />
        </div>
      </div>
    </div>
  );
}

export default MyAttendanceDonut;
