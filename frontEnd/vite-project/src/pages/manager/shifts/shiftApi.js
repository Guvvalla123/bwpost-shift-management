// shiftApi.js
// All API calls related to shifts.
// Import this file in any component
// that needs to call shift APIs.
// This keeps API calls in one place
// so they are easy to find and change.
//
// HOW TO USE:
//   import { getAllShifts, createShift } from "./shiftApi";
//   const result = await getAllShifts(1, 20, "all", "");

import API from "@/api";

// getAllShifts - gets a paginated list of shifts from the server
// page   - which page number to load (starts at 1)
// limit  - how many shifts to show per page
// status - filter by status: "all", "upcoming", "ongoing", "completed"
// search - text to search for in shift titles (empty string = no search)
// Returns an object: { shifts, totalPages, total }
export async function getAllShifts(page, limit, status, search) {
  // Build the query string parameters
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  // Only add status param if not "all" (server returns all by default)
  if (status && status !== "all") {
    params.set("status", status);
  }

  // Only add search param if user typed something
  if (search && search.trim()) {
    params.set("search", search.trim());
  }

  const response = await API.get(`/api/manager/shifts?${params}`);
  return {
    // The list of shift objects
    shifts: Array.isArray(response.data.data) ? response.data.data : [],
    // How many pages exist total
    totalPages: response.data.pagination?.totalPages ?? 1,
    // How many shifts exist total (for "showing X of Y" text)
    total: response.data.pagination?.total ?? 0,
  };
}

// getStatusCounts - gets the count of shifts in each status category
// Used to show the numbers on the 4 stat cards and filter tabs.
// Makes 4 parallel API calls to get all counts at once.
// Returns an object: { all, ongoing, upcoming, completed }
export async function getStatusCounts() {
  // Run all 4 count requests at the same time to be faster
  const [allRes, upcomingRes, ongoingRes, completedRes] = await Promise.all([
    API.get("/api/manager/shifts?page=1&limit=1"),
    API.get("/api/manager/shifts?page=1&limit=1&status=upcoming"),
    API.get("/api/manager/shifts?page=1&limit=1&status=ongoing"),
    API.get("/api/manager/shifts?page=1&limit=1&status=completed"),
  ]);

  return {
    all:       allRes.data?.pagination?.total ?? 0,
    upcoming:  upcomingRes.data?.pagination?.total ?? 0,
    ongoing:   ongoingRes.data?.pagination?.total ?? 0,
    completed: completedRes.data?.pagination?.total ?? 0,
  };
}

// getDashboardData - gets statistics for the donut chart
// Returns shift counts and recent shifts used to build the chart
export async function getDashboardData() {
  const response = await API.get("/api/manager/shifts/dashboard/data");
  // The server wraps data in either data.data or just data
  return response.data?.data ?? response.data;
}

// createShift - sends a new shift to the server to be saved
// shiftData - object with: shiftTitle, shiftStartTime, shiftEndTime,
//             slotsAvailable, shiftNotes
// Returns the created shift object
export async function createShift(shiftData) {
  const response = await API.post("/api/manager/shifts", shiftData);
  return response.data;
}

// updateShift - saves changes to an existing shift
// shiftId   - the MongoDB ID of the shift to update
// shiftData - object with the new field values
// Returns the updated shift object
export async function updateShift(shiftId, shiftData) {
  const response = await API.put(`/api/manager/shifts/${shiftId}`, shiftData);
  return response.data;
}

// deleteShift - permanently removes a shift from the database
// shiftId - the MongoDB ID of the shift to delete
// Returns success message from server
export async function deleteShift(shiftId) {
  const response = await API.delete(`/api/manager/shifts/${shiftId}`);
  return response.data;
}
