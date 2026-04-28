// AttendanceStats.jsx
// Shows the stat cards at the top of the attendance page.
// Cards show: Present (on time), Late, and Absent counts.
// Also shows a small donut chart of the attendance breakdown.
//
// This component is shown ONLY after a shift is selected.
// The parent (AttendancePage.jsx) passes in the calculated counts.

import React from "react";
import { CheckCircle2, Timer, XCircle } from "lucide-react";
import { KpiCard, DonutChart } from "@/components/ui";

// AttendanceStats - the row of stat cards + donut chart
//
// Props:
// presentCount - number of employees who arrived on time
//                (checked in AND not marked as late)
// lateCount    - number of employees who were late
//                (checked in BUT marked as late)
// absentCount  - number of employees who never checked in
//                (status is still "not_started")
// donutData    - array of { name, value, color } for the donut chart
//               example: [{ name: "Present", value: 5, color: "#1B3F8B" }]
// totalCount   - total number of employees in this shift
//               shown in the center of the donut chart
const AttendanceStats = ({ presentCount, lateCount, absentCount, donutData, totalCount }) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">

      {/* ── Left: 3 KPI cards (Present, Late, Absent) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-8">
        {/* Present card — green — employees who are on time */}
        <KpiCard
          variant="green"
          icon={CheckCircle2}
          label="Present"
          value={presentCount}
        />

        {/* Late card — amber — employees who checked in but were late */}
        <KpiCard
          variant="amber"
          icon={Timer}
          label="Late"
          value={lateCount}
        />

        {/* Absent card — red — employees who haven't checked in yet */}
        <KpiCard
          variant="red"
          icon={XCircle}
          label="Absent"
          value={absentCount}
        />
      </div>

      {/* ── Right: donut chart showing attendance breakdown ── */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-4">
        <p className="mb-2 text-center text-xs font-medium text-gray-500">
          Today&apos;s attendance
        </p>
        {/* DonutChart from shared UI components */}
        {/* centerValue shows the total number of employees in the shift */}
        <DonutChart
          data={donutData}
          size={112}
          centerValue={String(totalCount)}
          centerLabel="today"
        />
      </div>
    </div>
  );
};

export default AttendanceStats;
