// employeeApi.js
// All API calls related to employee management.
// Import this file in any component
// that needs employee data from server.
//
// HOW TO USE:
//   import { getAllEmployees, addEmployee } from "./employeeApi";
//   const result = await getAllEmployees(1, "john");

import API from "@/api";

// getAllEmployees - gets a paginated list of employees
// page   - which page number to load (starts at 1)
// search - text to filter by name or email (empty = no filter)
// Returns an object: { employees, totalPages, total }
export async function getAllEmployees(page, search) {
  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
  });
  if (search && search.trim()) {
    params.set("search", search.trim());
  }
  const response = await API.get(`/api/manager/shifts/employees?${params}`);
  const { data, pagination } = response.data;
  return {
    employees:  Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total:      pagination?.total ?? 0,
  };
}

// addEmployee - creates a new employee account in the system
// employeeData - object with: username, email, password
// Returns the created employee object
export async function addEmployee(employeeData) {
  const response = await API.post("/api/manager/shifts/employees", employeeData);
  return response.data;
}

// updateEmployee - updates an existing employee's information
// employeeId   - the MongoDB ID of the employee to update
// employeeData - object with new values: username, email
// Returns the updated employee object
export async function updateEmployee(employeeId, employeeData) {
  const response = await API.put(
    `/api/manager/shifts/employees/${employeeId}`,
    employeeData
  );
  return response.data;
}

// removeEmployee - deactivates an employee account
// The employee is NOT deleted from the database.
// They are marked as inactive and can no longer log in.
// employeeId - the MongoDB ID of the employee to deactivate
// Returns success message
export async function removeEmployee(employeeId) {
  const response = await API.delete(
    `/api/manager/shifts/employees/${employeeId}`
  );
  return response.data;
}

// getEmployeeAttendance - gets the full attendance history for an employee
// Used to show the history drawer when manager clicks an employee.
// employeeId - the MongoDB ID of the employee
// Returns an array of attendance records
export async function getEmployeeAttendance(employeeId) {
  const response = await API.get(
    `/api/manager/shifts/employees/${employeeId}/attendance`
  );
  const data = response.data.data;
  // Server can return the array directly OR wrapped in attendanceHistory key
  return Array.isArray(data) ? data : data?.attendanceHistory || [];
}

// generateResetLink - creates a password reset link for an employee
// The manager copies this link and sends it to the employee manually.
// employeeId - the MongoDB ID of the employee who needs a reset
// isAdmin    - true when called from admin panel (uses admin API path)
//              false when called from manager panel (default)
// Returns the reset link data: { resetLink, userEmail, expiresAt }
export async function generateResetLink(employeeId, isAdmin = false) {
  // The API path depends on whether we are in admin or manager context
  const path = isAdmin
    ? `/api/admin/users/${employeeId}/reset-password-link`
    : `/api/manager/shifts/employees/${employeeId}/reset-password-link`;
  const response = await API.post(path);
  // unwrap the data from the standard API response wrapper
  return response.data?.data ?? response.data;
}

// createInvite - generates a registration invite link for a new employee
// Manager sends this link to the new employee via WhatsApp.
// New employee clicks the link and registers their account.
// email - the email address to invite
// Returns the invite link URL string
export async function createInvite(email) {
  const response = await API.post("/api/invites", { email, role: "employee" });
  return response.data?.data?.inviteLink ?? null;
}

// getDashboardStats - gets employee stats for the KPI cards
// Returns the dashboard data including totalEmployees count
export async function getDashboardStats() {
  const response = await API.get("/api/manager/shifts/dashboard/data");
  return response.data?.data ?? response.data;
}

// copyToClipboard - copies text to clipboard with fallback for older browsers
// text - the string to copy
// Returns true if copied successfully, false otherwise
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that don't support clipboard API
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
