// AttendanceCard.jsx
// Shows ONE attendance record as a card on mobile screens.
// Each card has a colored left border based on status:
//   Green border  = checked in (actively working)
//   Amber border  = on break
//   Gray border   = checked out (completed)
//   Light gray    = not started yet (absent so far)
//
// The card also has action buttons at the bottom so the
// manager can manually trigger check-in, check-out, or breaks.

import React from "react";
import { Clock, LogIn, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import { formatTime } from "./attendanceApi";

// ─── Status badge component ───────────────────────────────────
// Shows a colored badge for the attendance status
const StatusBadge = ({ status }) => {
  // Style configuration for each possible status value
  const config = {
    checked_out:    { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    checked_in:     { label: "In Progress", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",         dot: "bg-blue-500 animate-pulse" },
    on_break:       { label: "On Break",    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-500 animate-pulse" },
    not_started:    { label: "Not Started", cls: "bg-slate-100 text-gray-500 ring-1 ring-gray-200",        dot: "bg-slate-400" },
    not_checked_in: { label: "Not Started", cls: "bg-slate-100 text-gray-500 ring-1 ring-gray-200",        dot: "bg-slate-400" },
  }[status] ?? { label: "Unknown", cls: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

// Avatar component — shows employee initials in a blue circle
const Avatar = ({ name }) => {
  // Get first letter of each word, uppercase, max 2 letters
  const initials = (name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3F8B] text-xs font-bold text-white shadow-sm">
      {initials}
    </div>
  );
};

// getBorderColor - returns the left border color CSS class for a status
const getBorderColor = (status) => {
  if (status === "checked_in")  return "border-l-green-500";
  if (status === "checked_out") return "border-l-gray-300";
  if (status === "on_break")    return "border-l-amber-500";
  return "border-l-gray-200";
};

// formatWorkDuration - converts minutes into readable "Xh Ym" format
const formatWorkDuration = (minutes) => {
  if (minutes == null || Number.isNaN(minutes)) return "—";
  const m = Math.max(0, Math.round(minutes));
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

// AttendanceCard - one attendance record card for mobile screens
//
// Props:
// record        - the attendance record object for one employee
//                 contains: employee, status, workSessions,
//                 totalWorkMinutes, isLate, lateByMins, leftEarly
// selectedShift - the currently selected shift object
//                 used to show the shift name on the card
// onViewEmployee - function called when employee name or avatar is clicked
//                  opens the employee attendance history drawer
// onCheckIn     - function called when Check In button is clicked
//                 receives employeeId as argument
// onCheckOut    - function called when Out (check out) button is clicked
//                 receives employeeId as argument
// onBreakStart  - function called when Break or Lunch button is clicked
//                 receives (employeeId, breakType) as arguments
//                 breakType is "short_break" or "lunch"
// onBreakEnd    - function called when Resume button is clicked
//                 receives employeeId as argument
// actionBusy    - the employeeId of the employee whose action is in progress
//                 used to show the spinner and disable buttons
const AttendanceCard = ({
  record,
  selectedShift,
  onViewEmployee,
  onCheckIn,
  onCheckOut,
  onBreakStart,
  onBreakEnd,
  actionBusy,
}) => {
  const employee = record.employee || {};

  // True if an API call is currently running for THIS employee
  const isBusy = actionBusy === employee._id;

  // Get the first check-in and last check-out from work sessions
  // An employee can have multiple sessions if they went on break
  const firstCheckIn  = record.workSessions?.[0]?.checkIn;
  const lastCheckOut  = record.workSessions?.[record.workSessions.length - 1]?.checkOut;
  const workMinutes   = record.totalWorkMinutes || 0;

  return (
    <div
      className={`rounded-2xl border border-gray-100 border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${getBorderColor(record.status)}`}
    >
      {/* TOP ROW: avatar + employee name + shift name */}
      <div
        className="mb-3 flex items-center gap-3 cursor-pointer"
        onClick={() => onViewEmployee(employee)}
        title="View employee history"
      >
        <Avatar name={employee.username || "?"} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate hover:text-[#1B3F8B] transition-colors">
            {employee.username || "Employee"}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {selectedShift?.shiftTitle || "Shift"}
          </p>
        </div>
      </div>

      {/* SECOND ROW: check-in and check-out times */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="text-gray-400 text-xs w-14 shrink-0">Check in</span>
          <span className="font-medium">{firstCheckIn ? formatTime(firstCheckIn) : "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="text-gray-400 text-xs w-14 shrink-0">Check out</span>
          <span className={`font-medium ${!lastCheckOut ? "text-gray-400 italic text-xs" : ""}`}>
            {lastCheckOut ? formatTime(lastCheckOut) : "Still working"}
          </span>
        </div>
      </div>

      {/* THIRD ROW: hours worked + flag badges (Late, Left Early) */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {formatWorkDuration(workMinutes)} worked
        </span>
        {record.isLate && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            Late
          </span>
        )}
        {record.leftEarly && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            Left Early
          </span>
        )}
      </div>

      {/* BOTTOM ROW: status badge + action buttons */}
      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        {/* Status badge on the right */}
        <div className="flex items-center justify-end">
          <StatusBadge status={record.status || "not_started"} />
        </div>

        {/* Check In button — shown only when employee hasn't checked in yet */}
        {record.status === "not_started" && (
          <button
            type="button"
            onClick={() => onCheckIn(employee._id)}
            disabled={isBusy}
            className="w-full min-h-11 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
          >
            <LogIn className="w-4 h-4" /> Check In
          </button>
        )}

        {/* Break and Check Out buttons — shown when employee is checked in */}
        {record.status === "checked_in" && (
          <>
            <button
              type="button"
              onClick={() => onBreakStart(employee._id, "short_break")}
              disabled={isBusy}
              className="w-full min-h-11 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
            >
              Break
            </button>
            <button
              type="button"
              onClick={() => onBreakStart(employee._id, "lunch")}
              disabled={isBusy}
              className="w-full min-h-11 rounded-xl text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 disabled:opacity-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
            >
              Lunch
            </button>
            <button
              type="button"
              onClick={() => onCheckOut(employee._id)}
              disabled={isBusy}
              className="w-full min-h-11 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            >
              <LogOut className="w-4 h-4" /> Out
            </button>
          </>
        )}

        {/* Resume button — shown when employee is on break */}
        {record.status === "on_break" && (
          <button
            type="button"
            onClick={() => onBreakEnd(employee._id)}
            disabled={isBusy}
            className="w-full min-h-11 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
          >
            Resume
          </button>
        )}

        {/* Completed text — shown when employee has checked out */}
        {record.status === "checked_out" && (
          <span className="text-xs text-center text-gray-500 py-1 inline-flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed
          </span>
        )}

        {/* Spinner shown while an action is in progress */}
        {isBusy && (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
        )}
      </div>
    </div>
  );
};

export default AttendanceCard;
