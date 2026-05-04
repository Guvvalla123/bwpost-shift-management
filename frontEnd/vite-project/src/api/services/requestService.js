// requestApi.js — shift requests API

import API from "../client.js";

export async function getAllRequests(status, type, page) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status && status !== "all") params.set("status", status);
  if (type && type !== "all") params.set("type", type);
  const response = await API.get(`/api/manager/requests?${params}`);
  const { data, pagination } = response.data;
  return {
    requests: Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total: pagination?.total ?? 0,
  };
}

export async function getRequestCounts() {
  const [all, pending, approved, rejected] = await Promise.all([
    API.get("/api/manager/requests?page=1&limit=1"),
    API.get("/api/manager/requests?page=1&limit=1&status=pending"),
    API.get("/api/manager/requests?page=1&limit=1&status=approved"),
    API.get("/api/manager/requests?page=1&limit=1&status=rejected"),
  ]);
  return {
    all: all.data?.pagination?.total ?? 0,
    pending: pending.data?.pagination?.total ?? 0,
    approved: approved.data?.pagination?.total ?? 0,
    rejected: rejected.data?.pagination?.total ?? 0,
  };
}

export async function approveRequest(requestId, managerNote = "") {
  const response = await API.put(`/api/manager/requests/${requestId}/approve`, { managerNote });
  return response.data;
}

export async function rejectRequest(requestId, note = "") {
  const response = await API.put(`/api/manager/requests/${requestId}/reject`, {
    managerNote: note,
  });
  return response.data;
}
