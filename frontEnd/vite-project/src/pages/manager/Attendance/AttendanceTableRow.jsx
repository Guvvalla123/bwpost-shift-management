// AttendanceTableRow.jsx
// Shows ONE attendance record as a table row on desktop screens.
// Only visible on medium screens and above (md:).
// Mobile uses AttendanceCard.jsx instead.
//
// Columns: Employee | Status | Sessions (check-in → check-out) |
//          Work time | Break time | Flags (Late/Left Early/OT) | Actions

import React from "react";
import {
  Timer, CheckCircle2, LogIn, LogOut, Loader2,
} from "lucide-react";
import { formatTime } from "./attendanceApi";

// StatusBadge - colored badge showing the attendance status
const StatusBadge = ({ status }) => {
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

// Avatar - shows employee initials in a blue circle
const Avatar = ({ name }) => {
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

// formatMins - converts minutes to "Xh Ym" or "Xm" display string
const formatMins = (minutes) => {
  if (!minutes || minutes <= 0) return null;
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`;
};

// AttendanceTableRow - one row in the desktop attendance table
//
// Props:
// record        - the attendance record object for one employee
//                 contains: employee, status, workSessions,
//                 totalWorkMinutes, totalBreakMinutes,
//                 isLate, lateByMins, leftEarly, overtimeMinutes
// onViewEmployee - function called when employee avatar/name is clicked
//                  opens the employee attendance history drawer
// onCheckIn     - function called when Check In button is clicked
//                 receives employeeId as argument
// onCheckOut    - function called when Out (check out) button is clicked
//                 receives employeeId as argument
// onBreakStart  - function called when Break or Lunch button is clicked
//                 receives (employeeId, breakType) as arguments
// onBreakEnd    - function called when Resume button is clicked
//                 receives employeeId as argument
// actionBusy    - the employeeId currently having an action run
//                 used to show spinner and disable buttons
const AttendanceTableRow = ({
  record,
  onViewEmployee,
  onCheckIn,
  onCheckOut,
  onBreakStart,
  onBreakEnd,
  actionBusy,
}) => {
  const employee = record.employee || {};

  // True if an API call is running for THIS employee
  const isBusy = actionBusy === employee._id;

  // First check-in across all work sessions
  const firstCheckIn = record.workSessions?.[0]?.checkIn;
  // Last check-out across all work sessions
  const lastCheckOut = record.workSessions?.[record.workSessions.length - 1]?.checkOut;
  // Number of sessions (shown if employee had multiple sessions)
  const sessionCount = record.workSessions?.length ?? 0;

  const workDisplay  = formatMins(record.totalWorkMinutes);
  const breakDisplay = formatMins(record.totalBreakMinutes);

  return (
    <tr className="hover:bg-slate-50/60 transition-colors duration-100">

      {/* COLUMN 1: Employee avatar and name */}
      <td className="px-4 py-3.5">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onViewEmployee(employee)}
          title="View employee history"
        >
          <Avatar name={employee.username || "?"} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#1B3F8B] transition-colors">
              {employee.username}
            </p>
            <p className="text-xs text-gray-400 truncate">{employee.email}</p>
          </div>
        </div>
      </td>

      {/* COLUMN 2: Status badge */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={record.status || "not_started"} />
      </td>

      {/* COLUMN 3: Sessions — first check-in to last check-out */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="text-xs">
          {firstCheckIn ? (
            <span className="text-emerald-600 font-medium">{formatTime(firstCheckIn)}</span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
          {lastCheckOut && (
            <>
              <span className="text-gray-300 mx-1">→</span>
              <span className="text-blue-600 font-medium">{formatTime(lastCheckOut)}</span>
            </>
          )}
          {/* Show session count badge if employee had multiple sessions (breaks) */}
          {sessionCount > 1 && (
            <span className="ml-1 text-[10px] bg-slate-100 text-gray-500 px-1 rounded">
              {sessionCount} sessions
            </span>
          )}
        </div>
      </td>

      {/* COLUMN 4: Total work time */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        {workDisplay ? (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#1B3F8B] bg-[#EFF6FF] px-2 py-0.5 rounded-lg">
            <Timer className="w-3 h-3" />{workDisplay}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>

      {/* COLUMN 5: Total break time */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        {breakDisplay ? (
          <span className="text-xs font-semibold text-amber-600">{breakDisplay}</span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* COLUMN 6: Flag badges (Late, Left Early, Overtime) */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          {record.isLate && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
              Late +{record.lateByMins}m
            </span>
          )}
          {record.leftEarly && (
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">
              Left Early
            </span>
          )}
          {record.overtimeMinutes > 0 && (
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded">
              OT +{formatMins(record.overtimeMinutes)}
            </span>
          )}
          {/* Dash when no flags */}
          {!record.isLate && !record.leftEarly && !record.overtimeMinutes && (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      </td>

      {/* COLUMN 7: Action buttons */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">

          {/* Check In — shown when employee hasn't started yet */}
          {record.status === "not_started" && (
            <button
              onClick={() => onCheckIn(employee._id)}
              disabled={isBusy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
            >
              <LogIn className="w-3 h-3" /> Check In
            </button>
          )}

          {/* Break, Lunch, Out — shown when employee is checked in */}
          {record.status === "checked_in" && (
            <>
              <button
                onClick={() => onBreakStart(employee._id, "short_break")}
                disabled={isBusy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition disabled:opacity-50"
              >
                Break
              </button>
              <button
                onClick={() => onBreakStart(employee._id, "lunch")}
                disabled={isBusy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition disabled:opacity-50"
              >
                Lunch
              </button>
              <button
                onClick={() => onCheckOut(employee._id)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
              >
                <LogOut className="w-3 h-3" /> Out
              </button>
            </>
          )}

          {/* Resume — shown when employee is on break */}
          {record.status === "on_break" && (
            <button
              onClick={() => onBreakEnd(employee._id)}
              disabled={isBusy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50 animate-pulse"
            >
              Resume
            </button>
          )}

          {/* Done badge — shown when employee has completed their shift */}
          {record.status === "checked_out" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-400 bg-slate-100 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Done
            </span>
          )}

          {/* Spinner while action is in progress */}
          {isBusy && (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin ml-1" />
          )}
        </div>
      </td>
    </tr>
  );
};

export default AttendanceTableRow;
