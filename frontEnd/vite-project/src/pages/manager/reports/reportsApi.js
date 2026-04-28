// reportsApi.js
// All API calls for the manager reports page.
// Import this file in ReportsPage.jsx.

import API from "@/api";

// getShiftsReport - gets shift data within a date range
// Also fetches the total employee count for KPI cards.
// startDate - YYYY-MM-DD string for start of period
// endDate   - YYYY-MM-DD string for end of period
// Returns { shifts, employeeTotal }
export async function getShiftsReport(startDate, endDate) {
  const shiftParams = new URLSearchParams({
    startDate,
    endDate,
    limit: "50",
    page:  "1",
  });
  const empParams = new URLSearchParams({ limit: "20", page: "1" });

  const [shiftsRes, empRes] = await Promise.all([
    API.get(`/api/manager/shifts?${shiftParams}`),
    API.get(`/api/manager/shifts/employees?${empParams}`),
  ]);

  return {
    shifts:        Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : [],
    employeeTotal: empRes.data?.pagination?.total ?? 0,
  };
}

// getAttendanceReport - gets attendance stats and dashboard summary data
// This includes the attendance rate used in the KPI card.
// Returns the dashData object from the server
export async function getAttendanceReport() {
  const response = await API.get("/api/manager/shifts/dashboard/data");
  return response.data?.data ?? response.data;
}

// exportReportCSV - downloads shift and roster report as a CSV file
// Triggers a browser file download automatically.
// startDate, endDate - date range (not used by server endpoint, server uses its own range)
export async function exportReportCSV() {
  const response = await API.get("/api/manager/shifts/export/csv", {
    responseType: "blob",
  });

  // Get filename from Content-Disposition header if available
  const disposition = response.headers["content-disposition"];
  let filename = "report.csv";
  if (disposition) {
    const match = disposition.match(/filename="([^"]+)"/);
    if (match) filename = match[1];
  }

  // Create a temporary link and click it to trigger download
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
