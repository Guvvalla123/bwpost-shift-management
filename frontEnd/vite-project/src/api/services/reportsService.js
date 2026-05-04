// reportsApi.js — manager reports API

import API from "../client.js";

export async function getShiftsReport(startDate, endDate) {
  const shiftParams = new URLSearchParams({
    startDate,
    endDate,
    limit: "50",
    page: "1",
  });
  const empParams = new URLSearchParams({ limit: "20", page: "1" });

  const [shiftsRes, empRes] = await Promise.all([
    API.get(`/api/manager/shifts?${shiftParams}`),
    API.get(`/api/manager/shifts/employees?${empParams}`),
  ]);

  return {
    shifts: Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : [],
    employeeTotal: empRes.data?.pagination?.total ?? 0,
  };
}

export async function getAttendanceReport() {
  const response = await API.get("/api/manager/shifts/dashboard/data");
  return response.data?.data ?? response.data;
}

export async function exportReportCSV() {
  const response = await API.get("/api/manager/shifts/export/csv", {
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"];
  let filename = "report.csv";
  if (disposition) {
    const match = disposition.match(/filename="([^"]+)"/);
    if (match) filename = match[1];
  }

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
