// checkinApi.js
// All API calls for employee check-in and check-out.
// Import this file in CheckInPage.jsx.

import API from "@/api";

// getMyShifts - gets the employee's assigned shifts list
// Filters client-side to show only currently active shifts.
// Returns array of all shift objects (filtering happens in page)
export async function getMyShifts() {
  const params = new URLSearchParams({ page: "1", limit: "20" });
  const response = await API.get(`/api/employee/shifts/myshifts?${params}`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

// getAttendance - gets the attendance record for a specific shift
// shiftId - the MongoDB ID of the shift to check attendance for
// Returns { shift, attendance } — attendance is null if not checked in
export async function getAttendance(shiftId) {
  const response = await API.get(`/api/attendance/my/${shiftId}`);
  const payload = response.data?.data;
  return {
    shift:      payload?.shift      ?? null,
    attendance: payload?.attendance ?? null,
  };
}

// checkIn - employee checks in to their current shift
// shiftId - the MongoDB ID of the shift to check in to
export async function checkIn(shiftId) {
  const response = await API.post("/api/attendance/checkin", { shiftId });
  return response.data;
}

// checkOut - employee checks out from their current shift
// shiftId - the MongoDB ID of the shift to check out from
export async function checkOut(shiftId) {
  const response = await API.post("/api/attendance/checkout", { shiftId });
  return response.data;
}

// startBreak - employee starts a break during their shift
// shiftId   - the MongoDB ID of the active shift
// breakType - type of break: "lunch" | "short_break"
export async function startBreak(shiftId, breakType) {
  const response = await API.post("/api/attendance/break/start", {
    shiftId,
    type: breakType,
  });
  return response.data;
}

// endBreak - employee ends their current break and returns to work
// shiftId - the MongoDB ID of the active shift
export async function endBreak(shiftId) {
  const response = await API.post("/api/attendance/break/end", { shiftId });
  return response.data;
}

// getWeeklyHours - gets total hours worked this week for the employee
// Returns { totalMinutes, remainingMinutes } or null on error
export async function getWeeklyHours() {
  const response = await API.get("/api/attendance/weekly-hours");
  const data = response.data?.data;
  if (!data || typeof data.totalMinutes !== "number") return null;
  return data;
}
