// employeeDashboardApi.js
// API calls for the employee dashboard (shifts list + pending requests).

import API from "@/api";

const PAGE_PARAMS = new URLSearchParams({ page: "1", limit: "50" });

// getMyShifts — GET assigned shifts for the logged-in employee
export async function getMyShifts() {
  const res = await API.get(`/api/employee/shifts/myshifts?${PAGE_PARAMS}`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

// getMyRequests — GET leave / change requests for this employee
export async function getMyRequests() {
  const res = await API.get(`/api/employee/shifts/requests?${PAGE_PARAMS}`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
