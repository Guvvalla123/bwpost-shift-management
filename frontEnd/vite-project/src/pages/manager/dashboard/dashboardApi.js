// dashboardApi.js
// API calls for the manager dashboard page.
// Import this file in ManagerDashboard.jsx.

import API from "@/api";

// getDashboardData - gets all dashboard data in one API call
// Returns shifts stats, attendance counts, recent shifts, and understaffed count.
// Shape: { stats, attendance, recentShifts, understaffedShifts }
export async function getDashboardData() {
  const response = await API.get("/api/manager/shifts/dashboard/data");
  return response.data?.data ?? response.data;
}
