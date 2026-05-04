// invitesApi.js — admin invites API

import API from "../client.js";

export async function getAllInvites(filter, page) {
  void filter;
  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
  });
  const res = await API.get(`/api/invites?${params}`);
  const { data, pagination } = res.data;
  return {
    invites: Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total: pagination?.total ?? 0,
  };
}

export async function createInvite(email, role, managerId) {
  const body = { email: email.trim(), role };
  if (role === "employee" && managerId) body.managerId = managerId;
  const res = await API.post("/api/invites", body);
  return res.data;
}

export async function getAllManagers() {
  const params = new URLSearchParams({ role: "manager", page: "1", limit: "50" });
  const res = await API.get(`/api/admin/users?${params}`);
  const raw = res.data?.data;
  return Array.isArray(raw) ? raw : [];
}
