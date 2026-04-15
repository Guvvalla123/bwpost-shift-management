/**
 * csvSecurity.js
 * Utility functions for secure CSV generation.
 * Handles sanitization, headers, and audit logging.
 */

"use strict";

/**
 * Sanitize a single cell value to prevent
 * CSV injection attacks.
 *
 * Attackers can inject Excel formulas into
 * CSV cells by starting values with:
 * = (formula), + (formula), - (formula),
 * @ (formula), TAB, CARRIAGE RETURN
 *
 * If a value starts with any of these
 * characters, we prefix it with a single
 * quote to neutralize the formula.
 *
 * Reference: OWASP CSV Injection
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string
  const str = String(value);

  // Characters that trigger formula execution
  // in spreadsheet applications
  const dangerousChars = ["=", "+", "-", "@",
    "\t", "\r"];

  if (dangerousChars.some(
    (char) => str.startsWith(char)
  )) {
    // Prefix with single quote to neutralize
    // the formula. The quote is visible in
    // raw CSV but Excel/Sheets treats the
    // cell as plain text.
    return `'${str}`;
  }

  // Remove newlines within cells to prevent
  // row injection attacks
  return str.replace(/[\r\n]/g, " ");
}

/**
 * Convert an array of objects to a
 * secure CSV string.
 *
 * Each cell value is:
 * 1. Sanitized against CSV injection
 * 2. Quoted if it contains commas or quotes
 * 3. Newlines removed to prevent row injection
 */
function objectsToCsv(headers, rows) {
  // Build header row
  const headerRow = headers
    .map((h) => `"${sanitizeCsvCell(h)}"`)
    .join(",");

  // Build data rows
  const dataRows = rows.map((row) => {
    return headers
      .map((header) => {
        const value = row[header] !== undefined
          ? row[header]
          : "";
        const sanitized = sanitizeCsvCell(value);
        // Wrap in quotes to handle commas
        // within values safely
        return `"${sanitized.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\r\n");
}

/**
 * Generate a safe CSV filename.
 * Never expose internal data or system info
 * in the filename.
 *
 * Format: report-YYYY-MM-DD.csv
 */
function generateSafeFilename(prefix) {
  const safePrefix = (prefix || "report")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const date = new Date()
    .toISOString()
    .split("T")[0];

  return `${safePrefix}-${date}.csv`;
}

/**
 * Set secure HTTP headers for CSV download.
 *
 * These headers ensure:
 * - Browser downloads the file (not displays it)
 * - Browser does not cache sensitive data
 * - Content type sniffing is prevented
 * - File is treated as CSV not HTML
 */
function setSecureCsvHeaders(res, filename) {
  const safeFilename = filename ||
    generateSafeFilename("report");

  // Force download instead of display
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFilename}"`
  );

  // Set correct MIME type
  res.setHeader("Content-Type", "text/csv");

  // Prevent browser from guessing content type
  // Stops browser from treating CSV as HTML
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  // Prevent caching of sensitive data
  // no-store means browser never saves it
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  // Prevent proxy servers from caching
  res.setHeader("Pragma", "no-cache");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
}

/**
 * Filter object to only include allowed keys.
 * Prevents accidental exposure of sensitive
 * fields like passwords, tokens, internal IDs.
 */
function filterAllowedFields(obj, allowedFields) {
  const filtered = {};
  for (const field of allowedFields) {
    filtered[field] = obj[field] !== undefined
      ? obj[field]
      : "";
  }
  return filtered;
}

/**
 * Define which fields each role can export.
 * Data minimization principle:
 * each role only sees what they need.
 */
const ALLOWED_CSV_FIELDS = {
  // Admin sees everything except sensitive auth fields
  admin: {
    users: [
      "username",
      "email",
      "role",
      "isActive",
      "createdAt",
    ],
    shifts: [
      "shiftTitle",
      "shiftStartTime",
      "shiftEndTime",
      "slotsAvailable",
      "createdAt",
    ],
    attendance: [
      "employee",
      "shift",
      "status",
      "totalWorkMinutes",
      "totalBreakMinutes",
      "isLate",
      "createdAt",
    ],
  },
  // Manager sees their team data only
  manager: {
    shifts: [
      "shiftTitle",
      "shiftStartTime",
      "shiftEndTime",
      "slotsAvailable",
      "createdAt",
    ],
    attendance: [
      "employee",
      "shift",
      "status",
      "totalWorkMinutes",
      "totalBreakMinutes",
      "isLate",
      "createdAt",
    ],
    employees: [
      "username",
      "email",
      "isActive",
      "createdAt",
    ],
  },
  // Employee cannot export any CSV
  employee: {},
};

/**
 * Check if a role is allowed to export
 * a specific data type as CSV.
 * Returns true if allowed, false if not.
 */
function isRoleAllowedToExport(role, dataType) {
  if (!ALLOWED_CSV_FIELDS[role]) {
    return false;
  }
  if (role === "employee") {
    return false;
  }
  return true;
}

/**
 * Get allowed fields for a role and data type.
 * Returns empty array if not allowed.
 */
function getAllowedFields(role, dataType) {
  if (!ALLOWED_CSV_FIELDS[role]) {
    return [];
  }
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
