// myRequestsApi.js
// API calls for the employee "My Requests" page.
// Import this file in MyRequestsPage.jsx.

import API from "@/api";

// getMyRequests - gets all shift requests submitted by the employee
// All filtering (status, type, date, search) is done client-side
// after fetching the full page from the server.
// filter - passed for future use but not currently sent to server
// page   - page number for pagination (starts at 1)
// Returns { requests, totalPages, total }
export async function getMyRequests(filter, page) {
  const params = new URLSearchParams({
    page:  String(page),
    limit: "20",
  });
  const response = await API.get(`/api/employee/shifts/requests?${params}`);
  const { data, pagination } = response.data;
  return {
    requests:   Array.isArray(data) ? data : [],
    totalPages: pagination?.totalPages ?? 1,
    total:      pagination?.total ?? 0,
  };
}
