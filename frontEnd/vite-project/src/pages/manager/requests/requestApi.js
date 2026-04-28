// requestApi.js
// All API calls for shift requests management.
// Import this file in any component that needs
// to fetch or update shift requests.

import API from "@/api";

// getAllRequests - gets paginated list of shift requests
// status - filter by status: "all" | "pending" | "approved" | "rejected"
// type   - filter by type: "all" | "leave" | "shift_change"
// page   - page number for pagination (starts at 1)
// Returns { requests, totalPages, total }
export async function getAllRequests(status, type, page) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status && status !== "all") params.set("status", status);
  if (type   && type   !== "all") params.set("type",   type);
  const response = await API.get(`/api/manager/requests?${params}`);
  const { data, pagination } = response.data;
  return {
    requests:   Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total:      pagination?.total ?? 0,
  };
}

// getRequestCounts - gets request counts per status tab
// Runs 4 API calls in parallel for speed.
// Returns { all, pending, approved, rejected }
export async function getRequestCounts() {
  const [all, pending, approved, rejected] = await Promise.all([
    API.get("/api/manager/requests?page=1&limit=1"),
    API.get("/api/manager/requests?page=1&limit=1&status=pending"),
    API.get("/api/manager/requests?page=1&limit=1&status=approved"),
    API.get("/api/manager/requests?page=1&limit=1&status=rejected"),
  ]);
  return {
    all:      all.data?.pagination?.total      ?? 0,
    pending:  pending.data?.pagination?.total  ?? 0,
    approved: approved.data?.pagination?.total ?? 0,
    rejected: rejected.data?.pagination?.total ?? 0,
  };
}

// approveRequest - approves a pending shift request
// Optionally sends a manager note to the employee.
// requestId  - MongoDB ID of the request to approve
// managerNote - optional message to send with the approval
export async function approveRequest(requestId, managerNote = "") {
  const response = await API.put(
    `/api/manager/requests/${requestId}/approve`,
    { managerNote }
  );
  return response.data;
}

// rejectRequest - rejects a pending shift request
// requestId  - MongoDB ID of the request to reject
// note       - optional manager note explaining the rejection
//              helpful for the employee to understand why
export async function rejectRequest(requestId, note = "") {
  const response = await API.put(
    `/api/manager/requests/${requestId}/reject`,
    { managerNote: note }
  );
  return response.data;
}
