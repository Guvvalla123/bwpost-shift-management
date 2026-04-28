// UserStats.jsx
// Shows the stat cards at the top of the admin users page.
// Cards display: Total Users, Active Users, and Inactive Users counts.
// These numbers come from the getUserStats API call in UsersPage.jsx.

import React from "react";
import { Users, UserCheck } from "lucide-react";
import { KpiCard } from "@/components/ui";

// UserStats - renders three KPI cards for user count overview
//
// Props:
// totalUsers    - total number of all users in the system
//                 includes both active and inactive accounts
// activeUsers   - number of users who are currently active
//                 and can log in
// inactiveUsers - number of deactivated user accounts
//                 these users cannot log in
const UserStats = ({ totalUsers, activeUsers, inactiveUsers }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total users card — navy blue */}
      <KpiCard
        variant="navy"
        icon={Users}
        label="Total Users"
        value={totalUsers}
      />

      {/* Active users card — green */}
      <KpiCard
        variant="green"
        icon={UserCheck}
        label="Active Users"
        value={activeUsers}
      />

      {/* Inactive users card — amber */}
      <KpiCard
        variant="amber"
        icon={UserCheck}
        label="Inactive Users"
        value={inactiveUsers}
      />
    </div>
  );
};

export default UserStats;
