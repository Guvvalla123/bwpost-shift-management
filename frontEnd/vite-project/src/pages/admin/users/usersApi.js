// usersApi.js
// All API calls for admin user management.
// Import this file in any component
// that needs user data from server.
// Only admin users can access these APIs.
//
// HOW TO USE:
//   import { getAllUsers, createUser } from "./usersApi";
//   const result = await getAllUsers(1, "john", "manager", false);

import API from "@/api";
import { unwrapSuccessData } from "@/utils/apiError";

// getAllUsers - gets a paginated list of all users in the system
// page            - which page to load (starts at 1)
// search          - text to filter by name or email (empty = no filter)
// role            - filter by role: "admin" | "manager" | "employee" | "" (empty = all)
// includeInactive - true to also include deactivated accounts
// Returns an object: { users, totalPages, total }
export async function getAllUsers(page, search, role, includeInactive) {
  const params = new URLSearchParams({
    page:  String(page),
    limit: "20",
  });
  if (search && search.trim())   params.set("search", search.trim());
  if (role)                      params.set("role", role);
  if (includeInactive)           params.set("includeInactive", "true");

  const response = await API.get(`/api/admin/users?${params}`);
  const { data, pagination } = response.data;
  return {
    users:      Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total:      pagination?.total ?? 0,
  };
}

// getUserStats - gets count statistics for all user groups
// Runs 5 API calls in parallel to get counts by role and status.
// Returns an object with: totalAll, active, inactive, admin, manager, employee
export async function getUserStats() {
  // Run all 5 count requests at the same time for speed
  const [allInc, activeOnly, admins, managers, employees] = await Promise.all([
    API.get("/api/admin/users?page=1&limit=1&includeInactive=true"),
    API.get("/api/admin/users?page=1&limit=1"),
    API.get("/api/admin/users?page=1&limit=1&role=admin&includeInactive=true"),
    API.get("/api/admin/users?page=1&limit=1&role=manager&includeInactive=true"),
    API.get("/api/admin/users?page=1&limit=1&role=employee&includeInactive=true"),
  ]);

  const totalAll = allInc.data?.pagination?.total ?? 0;
  const active   = activeOnly.data?.pagination?.total ?? 0;

  return {
    totalAll,
    active,
    inactive: Math.max(0, totalAll - active),
    admin:    admins.data?.pagination?.total ?? 0,
    manager:  managers.data?.pagination?.total ?? 0,
    employee: employees.data?.pagination?.total ?? 0,
  };
}

// createUser - admin creates a new user account directly
// userData - object with: username, email, password, role, managerId (if employee)
// Returns the created user object
export async function createUser(userData) {
  const response = await API.post("/api/admin/users", userData);
  return response.data;
}

// updateUserRole - changes a user's role in the system
// userId    - the MongoDB ID of the user to update
// newRole   - the new role: "admin" | "manager" | "employee"
// managerId - required when newRole is "employee"
//             the manager this employee will be assigned to
// Returns the updated user object
export async function updateUserRole(userId, newRole, managerId) {
  const payload = { role: newRole };
  // managerId is only sent when role is employee
  if (newRole === "employee" && managerId) {
    payload.managerId = managerId;
  }
  const response = await API.put(`/api/admin/users/${userId}/role`, payload);
  return response.data;
}

// generateResetLink - creates a password reset link for a user
// Admin copies this link and sends it to the user manually.
// userId - the MongoDB ID of the user who needs a reset
// Returns the reset link data: { resetLink, userEmail, expiresAt }
export async function generateResetLink(userId) {
  const response = await API.post(`/api/admin/users/${userId}/reset-password-link`);
  // unwrapSuccessData extracts the .data field from the standard API wrapper
  return unwrapSuccessData(response);
}

// createInvite - creates a self-registration invite link for a new user
// User clicks the link and registers their own account.
// email     - the email address to send the invite to
// role      - what role the new user will have: "admin" | "manager" | "employee"
// managerId - required when role is "employee"
//             the manager this new employee will belong to
// Returns the invite link URL string
export async function createInvite(email, role, managerId) {
  const payload = { email, role };
  // managerId only included for employee invites
  if (role === "employee" && managerId) {
    payload.managerId = managerId;
  }
  const response = await API.post("/api/invites", payload);
  return response.data?.data?.inviteLink ?? null;
}

// getAllManagers - gets the full list of active managers
// Used to populate manager selection dropdowns in Create and Invite forms.
// This is separate from getAllUsers so the dropdown always shows ALL managers
// even when user list is filtered to a different page or role.
// Returns an array of manager user objects
export async function getAllManagers() {
  const response = await API.get(
    "/api/admin/users?role=manager&limit=100&page=1"
  );
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
}
