// dashboardApi.js — manager dashboard data

import API from "../client.js";

export async function getDashboardData() {
  const response = await API.get("/api/manager/shifts/dashboard/data");
  return response.data?.data ?? response.data;
}
