// managersApi.js
// All API calls for admin manager management.
// Only admin users can access these endpoints.

import API from "@/api";
import { unwrapSuccessData } from "@/utils/apiError";

// getAllManagers - gets paginated list of managers
// page   - page number (starts at 1)
// search - optional text to filter by name or email
// includeInactive - when true, include deactivated managers
// Returns { managers, totalPages, total }
export async function getAllManagers(page, search, includeInactive = false) {
  const params = new URLSearchParams({
    role:  "manager",
    page:  String(page),
    limit: "20",
  });
  if (search && search.trim()) params.set("search", search.trim());
  if (includeInactive) params.set("includeInactive", "true");

  const res = await API.get(`/api/admin/users?${params}`);
  const { data, pagination } = res.data;
  return {
    managers:   Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total:      pagination?.total ?? 0,
  };
}

// addManager - creates a new manager account directly
// managerData - { username, email, password }
// role "manager" is always added by this function.
export async function addManager(managerData) {
  const res = await API.post("/api/admin/users", { ...managerData, role: "manager" });
  return res.data;
}

// deactivateManager - soft-deactivates a manager account.
// Uses the same employee deactivate endpoint admins can access.
// managerId - MongoDB ID of the manager to deactivate
export async function deactivateManager(managerId) {
  const res = await API.delete(`/api/manager/shifts/employees/${managerId}`);
  return res.data;
}

// generateResetLink - creates a password reset link for a manager
// managerId - MongoDB ID of the manager account
// Returns { resetLink, userEmail, expiresAt } inside data
export async function generateResetLink(managerId) {
  const res = await API.post(`/api/admin/users/${managerId}/reset-password-link`);
  return unwrapSuccessData(res);
}

// createManagerInvite - creates a self-registration invite for a manager
// email - the email address to invite
// Returns invite data including inviteLink when present
export async function createManagerInvite(email) {
  const res = await API.post("/api/invites", { email, role: "manager" });
  return res.data;
}
