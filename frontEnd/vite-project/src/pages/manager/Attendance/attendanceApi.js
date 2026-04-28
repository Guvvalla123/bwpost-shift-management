// attendanceApi.js
// All API calls related to attendance.
// Import this file in any component
// that needs attendance data from server.
//
// HOW TO USE:
//   import { getAllShifts, getShiftAttendance } from "./attendanceApi";
//   const shifts = await getAllShifts();

import API from "@/api";
import { toast } from "sonner";

// ─── Formatting helpers used by CSV export ───────────────────
// These convert ISO date strings to readable formats

// formatDate - converts ISO string to "Jan 5, 2025" format
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

// formatTime - converts ISO string to "09:00 AM" format
export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

// ─── API Functions ────────────────────────────────────────────

// getAllShifts - gets the list of shifts for the dropdown selector
// search - optional text to filter shifts by title
// Returns an array of shift objects
export async function getAllShifts(search = "") {
  // Build query params: 20 shifts per page, optional search
  const params = new URLSearchParams({ limit: "20", page: "1" });
  if (search) params.set("search", search);
  const response = await API.get(`/api/manager/shifts?${params}`);
  return Array.isArray(response.data.data) ? response.data.data : [];
}

// getShiftAttendance - gets all attendance records for one shift
// shiftId - the MongoDB ID of the shift to load attendance for
// Returns an object: { shift, attendance }
//   shift     - the full shift details
//   attendance - array of attendance records (one per employee)
export async function getShiftAttendance(shiftId) {
  const response = await API.get(`/api/attendance/shift/${shiftId}`);
  // Server returns data nested inside response.data.data
  return response.data.data || { shift: null, attendance: [] };
}

// getEmployeeAttendance - gets the full attendance history for one employee
// employeeId - the MongoDB ID of the employee
// Returns an object: { employee, attendanceHistory }
//   employee         - the employee details
//   attendanceHistory - array of all their past attendance records
export async function getEmployeeAttendance(employeeId) {
  const response = await API.get(
    `/api/manager/shifts/employees/${employeeId}/attendance`
  );
  return response.data.data || null;
}

// checkInEmployee - manually records check-in for an employee
// shiftId    - which shift they are checking into
// employeeId - which employee to check in
export async function checkInEmployee(shiftId, employeeId) {
  await API.post("/api/attendance/checkin", { shiftId, employeeId });
}

// checkOutEmployee - manually records check-out for an employee
// shiftId    - which shift they are checking out of
// employeeId - which employee to check out
export async function checkOutEmployee(shiftId, employeeId) {
  await API.post("/api/attendance/checkout", { shiftId, employeeId });
}

// startBreak - records when an employee goes on break
// shiftId    - which shift
// employeeId - which employee
// breakType  - "short_break" for a short break or "lunch" for lunch
export async function startBreak(shiftId, employeeId, breakType) {
  await API.post("/api/attendance/break/start", {
    shiftId,
    employeeId,
    type: breakType,
  });
}

// endBreak - records when an employee comes back from break
// shiftId    - which shift
// employeeId - which employee
export async function endBreak(shiftId, employeeId) {
  await API.post("/api/attendance/break/end", { shiftId, employeeId });
}

// ─── CSV Export helpers ───────────────────────────────────────
// These helpers are client-side — no server call needed.
// They take data already loaded and create a downloadable CSV file.

// triggerCSVDownload - creates and downloads a CSV file in the browser
// rows     - array of objects, each object is one row
// filename - the name of the file to download
function triggerCSVDownload(rows, filename) {
  if (!rows.length) {
    toast.error("No data to export");
    return;
  }
  // Use the first row's keys as the column headers
  const headers = Object.keys(rows[0]);
  // Build CSV string: header row, then one row per record
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((col) => `"${String(row[col] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  // Create a download link and click it automatically
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} exported`);
}

// exportAttendanceCSV - builds and downloads attendance CSV for a shift
// shift   - the shift object (for the filename and shift info)
// records - the attendance records for this shift (already loaded)
export function exportAttendanceCSV(shift, records) {
  const rows = records.map((rec) => ({
    "Employee":    rec.employee?.username ?? "",
    "Email":       rec.employee?.email ?? "",
    "Status":      rec.status ?? "",
    "Work Mins":   rec.totalWorkMinutes ?? 0,
    "Break Mins":  rec.totalBreakMinutes ?? 0,
    "Late?":       rec.isLate ? `Yes (+${rec.lateByMins}min)` : "No",
    "Left Early?": rec.leftEarly ? "Yes" : "No",
  }));
  const safeName = shift?.shiftTitle?.replace(/\s+/g, "_") ?? "shift";
  triggerCSVDownload(rows, `Attendance_${safeName}.csv`);
}

// exportTimesheetCSV - builds and downloads timesheet CSV for one employee
// employee - the employee object (for the filename)
// history  - array of attendance history records
export function exportTimesheetCSV(employee, history) {
  const rows = history.map((rec) => {
    // Only show checkout time if it's different from check-in (not same timestamp)
    const checkOutValid =
      rec.checkOut &&
      new Date(rec.checkOut).getTime() !== new Date(rec.checkIn).getTime();
    return {
      "Employee":  employee?.username ?? "",
      "Email":     employee?.email ?? "",
      "Shift":     rec.shiftTitle ?? "",
      "Date":      formatDate(rec.shiftDate),
      "Check-In":  formatTime(rec.checkIn),
      "Check-Out": checkOutValid ? formatTime(rec.checkOut) : "In Progress",
      "Hours":     rec.totalHours ? `${rec.totalHours}h` : "—",
    };
  });
  const safeName = employee?.username?.replace(/\s+/g, "_") ?? "employee";
  triggerCSVDownload(rows, `Timesheet_${safeName}.csv`);
}
