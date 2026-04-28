// invitesApi.js
// All API calls for admin invite management.

import API from "@/api";

// getAllInvites — GET paginated invite list from the server.
// filter — "all" | "pending" | "used" | "expired" (used on the client only; the API
//          returns the full page and the UI filters like the original page).
// page  — page number (1-based).
export async function getAllInvites(filter, page) {
  void filter;
  const params = new URLSearchParams({
    page:  String(page),
    limit: "20",
  });
  const res = await API.get(`/api/invites?${params}`);
  const { data, pagination } = res.data;
  return {
    invites:    Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total:      pagination?.total ?? 0,
  };
}

// createInvite — POST a new registration invite.
// email     — recipient email
// role      — "manager" | "employee"
// managerId — required when role is "employee" (assigns the future employee to that manager)
export async function createInvite(email, role, managerId) {
  const body = { email: email.trim(), role };
  if (role === "employee" && managerId) body.managerId = managerId;
  const res = await API.post("/api/invites", body);
  return res.data;
}

// getAllManagers — GET managers for the employee-invite dropdown (same query as legacy page).
export async function getAllManagers() {
  const params = new URLSearchParams({ role: "manager", page: "1", limit: "50" });
  const res = await API.get(`/api/admin/users?${params}`);
  const raw = res.data?.data;
  return Array.isArray(raw) ? raw : [];
}
