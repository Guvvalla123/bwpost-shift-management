// csvHelper.js
// Helper functions for CSV file export.
//
// CSV injection is a security risk where
// someone puts a formula like =CMD() in
// a field and Excel runs it when opened.
//
// These functions clean the data before
// putting it in the CSV file to prevent
// this type of attack.
//
// Used when manager exports shift data
// from the Reports page.

"use strict";

// sanitizeCsvCell - cleans a single cell value to prevent CSV injection
// Attackers can inject Excel formulas into CSV cells by starting values with:
//   = (formula), + (formula), - (formula), @ (formula), TAB, CARRIAGE RETURN
// If a value starts with any of these characters, we prefix it with a single
// quote to neutralize the formula.
// Reference: OWASP CSV Injection
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string
  const str = String(value);

  // Characters that trigger formula execution in spreadsheet applications
  const dangerousChars = ["=", "+", "-", "@", "\t", "\r"];

  if (dangerousChars.some((char) => str.startsWith(char))) {
    // Prefix with single quote to neutralize the formula.
    // The quote is visible in raw CSV but Excel/Sheets treats the
    // cell as plain text.
    return `'${str}`;
  }

  // Remove newlines within cells to prevent row injection attacks
  return str.replace(/[\r\n]/g, " ");
}

// objectsToCsv - converts an array of objects to a secure CSV string
// Each cell value is:
// 1. Sanitized against CSV injection
// 2. Quoted if it contains commas or quotes
// 3. Newlines removed to prevent row injection
//
// headers - array of field names to use as column headers
// rows - array of objects where each object is one row
function objectsToCsv(headers, rows) {
  // Build header row
  const headerRow = headers
    .map((h) => `"${sanitizeCsvCell(h)}"`)
    .join(",");

  // Build data rows
  const dataRows = rows.map((row) => {
    return headers
      .map((header) => {
        const value = row[header] !== undefined ? row[header] : "";
        const sanitized = sanitizeCsvCell(value);
        // Wrap in quotes to handle commas within values safely
        return `"${sanitized.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\r\n");
}

// generateSafeFilename - creates a safe filename for the CSV download
// Never expose internal data or system info in the filename.
// Format: prefix-YYYY-MM-DD.csv
// Example: shifts-report-2024-01-15.csv
function generateSafeFilename(prefix) {
  const safePrefix = (prefix || "report")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const date = new Date().toISOString().split("T")[0];
  return `${safePrefix}-${date}.csv`;
}

// setSecureCsvHeaders - sets HTTP headers on the response for a CSV download
// These headers ensure the browser downloads the file (not displays it),
// does not cache sensitive data, and treats it as CSV not HTML.
//
// res - the Express response object
// filename - the name of the file to download
function setSecureCsvHeaders(res, filename) {
  const safeFilename = filename || generateSafeFilename("report");

  // Force download instead of display in browser
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);

  // Set correct MIME type for CSV
  res.setHeader("Content-Type", "text/csv");

  // Prevent browser from guessing content type (stops treating CSV as HTML)
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent caching of sensitive data (no-store means browser never saves it)
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  // Prevent proxy servers from caching the response
  res.setHeader("Pragma", "no-cache");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
}

// filterAllowedFields - returns a new object with only the allowed fields
// Prevents accidental exposure of sensitive fields like passwords or tokens.
//
// obj - the original data object
// allowedFields - array of field names that are safe to include
function filterAllowedFields(obj, allowedFields) {
  const filtered = {};
  for (const field of allowedFields) {
    filtered[field] = obj[field] !== undefined ? obj[field] : "";
  }
  return filtered;
}

// ALLOWED_CSV_FIELDS - defines which fields each role can export
// Data minimization: each role only sees what they need.
// Employees cannot export any CSV data.
const ALLOWED_CSV_FIELDS = {
  // Admin sees everything except sensitive auth fields
  admin: {
    users: ["username", "email", "role", "isActive", "createdAt"],
    shifts: ["shiftTitle", "shiftStartTime", "shiftEndTime", "slotsAvailable", "createdAt"],
    attendance: ["employee", "shift", "status", "totalWorkMinutes", "totalBreakMinutes", "isLate", "createdAt"],
  },
  // Manager sees their team data only
  manager: {
    shifts: ["shiftTitle", "shiftStartTime", "shiftEndTime", "slotsAvailable", "createdAt"],
    attendance: ["employee", "shift", "status", "totalWorkMinutes", "totalBreakMinutes", "isLate", "createdAt"],
    employees: ["username", "email", "isActive", "createdAt"],
  },
  // Employee cannot export any CSV data
  employee: {},
};

// isRoleAllowedToExport - checks if a role can export a specific data type
// Returns true if allowed, false if not
//
// role - the user's role (admin, manager, or employee)
// dataType - what kind of data they want to export (shifts, users, etc.)
function isRoleAllowedToExport(role, dataType) {
  if (!ALLOWED_CSV_FIELDS[role]) return false;
  if (role === "employee") return false;
  return true;
}

// getAllowedFields - returns the list of fields a role can include in the export
// Returns an empty array if the role is not allowed to export this data type.
//
// role - the user's role
// dataType - what kind of data (shifts, users, attendance, etc.)
function getAllowedFields(role, dataType) {
  if (!ALLOWED_CSV_FIELDS[role]) return [];
  return ALLOWED_CSV_FIELDS[role][dataType] || [];
}

module.exports = {
  sanitizeCsvCell,
  objectsToCsv,
  generateSafeFilename,
  setSecureCsvHeaders,
  filterAllowedFields,
  ALLOWED_CSV_FIELDS,
  isRoleAllowedToExport,
  getAllowedFields,
};
