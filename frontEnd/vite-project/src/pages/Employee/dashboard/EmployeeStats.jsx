// EmployeeStats.jsx
// Four KPI cards: total shifts, upcoming, completed, attendance rate text.

import React from "react";
import { KpiCard } from "@/components/ui";

// EmployeeStats fills the responsive grid matching the original dashboard
//
// Props:
// totalShifts     - Count of shifts returned for this employee (page slice)
// upcomingShifts - Count whose status derived as "upcoming"
// completedShifts - Count whose status is "completed"
// attendanceRate - Pre-formatted attendance string (same as original `%` placeholder)
function EmployeeStats({ totalShifts, upcomingShifts, completedShifts, attendanceRate }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard variant="navy" label="My Total Shifts" value={totalShifts} />
      <KpiCard variant="default" label="Upcoming" value={upcomingShifts} />
      <KpiCard variant="green" label="Completed" value={completedShifts} />
      <KpiCard variant="amber" label="My Attendance Rate" value={attendanceRate} />
    </div>
  );
}

export default EmployeeStats;
