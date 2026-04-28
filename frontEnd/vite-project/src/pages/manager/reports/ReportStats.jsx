// ReportStats.jsx
// Shows 4 KPI stat cards for the selected date range.
// Only rendered when there is data to show.

import React from "react";
import { KpiCard } from "@/components/ui";
import { CalendarDays, TrendingUp, Users, AlertTriangle } from "lucide-react";

// ReportStats - 4 KPI cards row for the reports page
//
// Props:
// totalShifts     - total number of shifts in the selected period
// attendanceRate  - average attendance rate as a percentage number
// employeesInvolved - number of unique employees who worked in the period
// understaffed    - number of shifts that still need more employees
const ReportStats = ({
  totalShifts,
  attendanceRate,
  employeesInvolved,
  understaffed,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        variant="navy"
        icon={CalendarDays}
        label="Total shifts (period)"
        value={totalShifts}
      />
      <KpiCard
        variant="default"
        icon={TrendingUp}
        label="Avg. attendance rate"
        value={`${attendanceRate}%`}
      />
      <KpiCard
        variant="green"
        icon={Users}
        label="Employees involved"
        value={employeesInvolved}
      />
      <KpiCard
        variant="amber"
        icon={AlertTriangle}
        label="Shifts needing staff"
        value={understaffed}
      />
    </div>
  );
};

export default ReportStats;
