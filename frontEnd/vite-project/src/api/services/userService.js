// usersApi.js — admin users API

import API from "../client.js";
import { unwrapSuccessData } from "@/utils/apiError";

export async function getAllUsers(page, search, role, includeInactive) {
  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
  });
  if (search && search.trim()) params.set("search", search.trim());
  if (role) params.set("role", role);
  if (includeInactive) params.set("includeInactive", "true");

  const response = await API.get(`/api/admin/users?${params}`);
  const { data, pagination } = response.data;
  return {
    users: Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total: pagination?.total ?? 0,
  };
}

export async function getUserStats() {
  const [allInc, activeOnly, admins, managers, employees] = await Promise.all([
    API.get("/api/admin/users?page=1&limit=1&includeInactive=true"),
    API.get("/api/admin/users?page=1&limit=1"),
    API.get("/api/admin/users?page=1&limit=1&role=admin&includeInactive=true"),
    API.get("/api/admin/users?page=1&limit=1&role=manager&includeInactive=true"),
    API.get("/api/admin/users?page=1&limit=1&role=employee&includeInactive=true"),
  ]);

  const totalAll = allInc.data?.pagination?.total ?? 0;
  const active = activeOnly.data?.pagination?.total ?? 0;

  return {
    totalAll,
    active,
    inactive: Math.max(0, totalAll - active),
    admin: admins.data?.pagination?.total ?? 0,
    manager: managers.data?.pagination?.total ?? 0,
    employee: employees.data?.pagination?.total ?? 0,
  };
}

export async function createUser(userData) {
  const response = await API.post("/api/admin/users", userData);
  return response.data;
}

export async function updateUserRole(userId, newRole, managerId) {
  const payload = { role: newRole };
  if (newRole === "employee" && managerId) {
    payload.managerId = managerId;
  }
  const response = await API.put(`/api/admin/users/${userId}/role`, payload);
  return response.data;
}

export async function generateResetLink(userId) {
  const response = await API.post(`/api/admin/users/${userId}/reset-password-link`);
  return unwrapSuccessData(response);
}

export async function createInvite(email, role, managerId) {
  const payload = { email, role };
  if (role === "employee" && managerId) {
    payload.managerId = managerId;
  }
  const response = await API.post("/api/invites", payload);
  return response.data?.data?.inviteLink ?? null;
}

export async function getAllManagers() {
  const response = await API.get("/api/admin/users?role=manager&limit=100&page=1");
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
}
