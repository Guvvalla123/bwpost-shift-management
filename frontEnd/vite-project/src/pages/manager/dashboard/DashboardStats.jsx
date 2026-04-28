// DashboardStats.jsx
// Shows the 4 KPI stat cards at the top of the manager dashboard.
// Cards: Total Staff, Upcoming Shifts, Present Rate, Need Staff.

import React from "react";
import { KpiCard } from "@/components/ui";
import { Users, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

// DashboardStats - 4 KPI cards in a 2-col / 4-col grid
//
// Props:
// totalStaff     - total number of employees managed
// upcomingShifts - count of upcoming (future) shifts
// presentRate    - attendance percentage for today (number, appended with %)
// needStaff      - count of understaffed shifts that still need employees
const DashboardStats = ({ totalStaff, upcomingShifts, presentRate, needStaff }) => {
  return (
    <div className="mb-4 grid h-auto grid-cols-2 gap-3 lg:grid-cols-4 lg:items-stretch">
      <KpiCard variant="navy"    icon={Users}         label="Total Staff"       value={totalStaff} />
      <KpiCard variant="default" icon={Calendar}      label="Upcoming Shifts"   value={upcomingShifts} />
      <KpiCard variant="green"   icon={TrendingUp}    label="Present Rate"      value={`${presentRate}%`} />
      <KpiCard variant="amber"   icon={AlertTriangle} label="Need Staff"        value={needStaff} />
    </div>
  );
};

export default DashboardStats;
