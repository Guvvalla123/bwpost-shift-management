// managersApi.js — admin managers API

import API from "../client.js";
import { unwrapSuccessData } from "@/utils/apiError";

export async function getAllManagers(page, search, includeInactive = false) {
  const params = new URLSearchParams({
    role: "manager",
    page: String(page),
    limit: "20",
  });
  if (search && search.trim()) params.set("search", search.trim());
  if (includeInactive) params.set("includeInactive", "true");

  const res = await API.get(`/api/admin/users?${params}`);
  const { data, pagination } = res.data;
  return {
    managers: Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total: pagination?.total ?? 0,
  };
}

export async function addManager(managerData) {
  const res = await API.post("/api/admin/users", { ...managerData, role: "manager" });
  return res.data;
}

export async function deactivateManager(managerId) {
  const res = await API.delete(`/api/manager/shifts/employees/${managerId}`);
  return res.data;
}

export async function generateResetLink(managerId) {
  const res = await API.post(`/api/admin/users/${managerId}/reset-password-link`);
  return unwrapSuccessData(res);
}

export async function createManagerInvite(email) {
  const res = await API.post("/api/invites", { email, role: "manager" });
  return res.data;
}
