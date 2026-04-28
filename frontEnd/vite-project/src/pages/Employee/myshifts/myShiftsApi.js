// myShiftsApi.js
// API calls for the employee "My Shifts" page.
// Import this file in MyShiftsPage.jsx.

import API from "@/api";

// getMyShifts - gets all shifts the employee is assigned to
// page   - page number for pagination (starts at 1)
// Returns { shifts, totalPages, total }
export async function getMyShifts(page) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  const response = await API.get(`/api/employee/shifts/myshifts?${params}`);
  const { data, pagination } = response.data;
  return {
    shifts:     Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total:      pagination?.total ?? 0,
  };
}

// getAvailableShifts - gets all publicly available shifts
// Used to populate the shift selector in the shift-change request modal.
// Employee can request to swap their shift for one of these.
// Returns array of shift objects
export async function getAvailableShifts() {
  const params = new URLSearchParams({ limit: "50", page: "1" });
  const response = await API.get(`/api/employee/shifts/available-shifts?${params}`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

// submitLeaveRequest - employee requests leave for an upcoming shift
// This is what the user calls "cancel shift" — they request to be absent.
// shiftId - the MongoDB ID of the shift to request leave from
// reason  - optional text explaining why (can be empty string)
export async function submitLeaveRequest(shiftId, reason) {
  const response = await API.post("/api/employee/shifts/requests/leave", {
    shiftId,
    reason,
  });
  return response.data;
}

// submitShiftChangeRequest - employee requests to switch to a different shift
// currentShiftId   - the shift they want to leave
// requestedShiftId - the shift they want to switch to
// reason           - optional explanation
export async function submitShiftChangeRequest(currentShiftId, requestedShiftId, reason) {
  const response = await API.post("/api/employee/shifts/requests/shift-change", {
    currentShiftId,
    requestedShiftId,
    reason,
  });
  return response.data;
}
