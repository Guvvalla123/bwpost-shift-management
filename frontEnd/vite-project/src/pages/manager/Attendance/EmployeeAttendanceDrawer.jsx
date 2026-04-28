// EmployeeAttendanceDrawer.jsx
// Shows detailed attendance history for one specific employee
// in a side panel that slides in from the right.
//
// HOW IT OPENS:
// Manager clicks on an employee's name or avatar in the
// attendance table or card list.
// The selectedEmployee state is set in AttendancePage.jsx.
// This drawer receives that employee as a prop and shows all
// their past attendance records (their personal timesheet).
//
// HOW IT CLOSES:
// Manager clicks the X button at the top right of the drawer.
// The onClose function is called, which sets selectedEmployee
// back to null in AttendancePage.jsx, hiding the drawer.
//
// This is the same "drawer" pattern used in ShiftDetails.jsx.
// The panel slides in from the right and overlays the content.
//
// WHY THIS IS USEFUL:
// Instead of switching to a separate Timesheet tab, the manager
// can quickly see any employee's history by clicking their name
// directly in the attendance table.

import React from "react";
import {
  X, CalendarDays, Timer, Clock,
  Download, UserCheck,
} from "lucide-react";
import { SkeletonList } from "@/components/ui";
import { formatDate, formatTime, exportTimesheetCSV } from "./attendanceApi";

// formatMins - converts minutes to "Xh Ym" or "Xm" display string
const formatMins = (minutes) => {
  if (!minutes || minutes <= 0) return "—";
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`;
};

// getInitials - gets first 2 letters of a name in uppercase
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// EmployeeAttendanceDrawer - the sliding side panel for employee history
//
// Props:
// employee          - the employee object to show history for
//                     contains: _id, username, email
//                     if null, the drawer is hidden
// attendanceHistory - array of attendance records for this employee
//                     loaded by AttendancePage when employee is clicked
//                     each record has: shiftTitle, shiftDate, checkIn,
//                     checkOut, totalHours, isLate, lateByMins
// loading           - true while the attendance history is being fetched
//                     shows skeleton list inside the drawer
// onClose           - function called when X button is clicked
//                     sets selectedEmployee to null in AttendancePage.jsx
const EmployeeAttendanceDrawer = ({ employee, attendanceHistory, loading, onClose }) => {
  // If no employee is selected, don't render anything
  if (!employee) return null;

  // Calculate totals for the summary stats at the top of the drawer
  const totalShifts = attendanceHistory.length;
  const totalHours  = attendanceHistory.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const lateCount   = attendanceHistory.filter((r) => r.isLate).length;

  return (
    // Dark backdrop — clicking it closes the drawer
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* The white panel that slides in from the right */}
      <div
        className="bg-white h-full w-full sm:w-[460px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER: blue gradient with employee info ── */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Employee avatar circle with initials */}
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0 border border-white/30">
                {getInitials(employee.username || "")}
              </div>
              <div>
                <p className="text-sm text-blue-200 font-medium mb-1">Attendance History</p>
                <h2 className="text-xl font-bold text-white leading-tight">
                  {employee.username || "Employee"}
                </h2>
                <p className="text-blue-200 text-sm mt-1 truncate">
                  {employee.email || ""}
                </p>
              </div>
            </div>

            {/* X close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition text-white shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Summary stats row: Shifts Worked, Total Hours, Late count */}
          {!loading && attendanceHistory.length > 0 && (
            <div className="flex gap-4 mt-5">
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center border border-white/20">
                <p className="text-2xl font-bold text-white tabular-nums">{totalShifts}</p>
                <p className="text-xs text-blue-200 mt-0.5">Shifts</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center border border-white/20">
                <p className="text-2xl font-bold text-white tabular-nums">
                  {Math.round(totalHours * 10) / 10}h
                </p>
                <p className="text-xs text-blue-200 mt-0.5">Total Hours</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center border border-white/20">
                <p className="text-2xl font-bold text-white tabular-nums">{lateCount}</p>
                <p className="text-xs text-blue-200 mt-0.5">Late</p>
              </div>
            </div>
          )}
        </div>

        {/* ── CONTENT: attendance history records ── */}
        <div className="p-6">

          {/* Export CSV button — downloads all records as a spreadsheet */}
          {!loading && attendanceHistory.length > 0 && (
            <button
              type="button"
              onClick={() => exportTimesheetCSV(employee, attendanceHistory)}
              className="mb-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all"
            >
              <Download className="w-4 h-4" /> Export Timesheet CSV
            </button>
          )}

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            All Attendance Records
          </p>

          {/* Loading state — show skeleton while fetching */}
          {loading && (
            <SkeletonList count={5} />
          )}

          {/* Empty state — shown when employee has no attendance history */}
          {!loading && attendanceHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <UserCheck className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-500">No attendance records</p>
              <p className="text-xs text-gray-400 mt-1 text-center">
                This employee has not attended any shifts yet.
              </p>
            </div>
          )}

          {/* List of attendance records */}
          {!loading && attendanceHistory.length > 0 && (
            <div className="space-y-3">
              {attendanceHistory.map((record, index) => {
                // Only show checkout time if it's different from check-in
                const checkOutValid =
                  record.checkOut &&
                  new Date(record.checkOut).getTime() !== new Date(record.checkIn).getTime();

                return (
                  <div
                    key={record.shiftId || index}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-colors"
                  >
                    {/* Row 1: Shift title + record number */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Blue calendar icon */}
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-blue-600 flex items-center justify-center shrink-0">
                          <CalendarDays className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {record.shiftTitle}
                        </p>
                      </div>
                      {/* Record number */}
                      <span className="text-xs text-gray-300 font-medium tabular-nums shrink-0">
                        #{String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Row 2: Date */}
                    <p className="text-xs text-gray-500 mb-3 ml-9">
                      {formatDate(record.shiftDate)}
                    </p>

                    {/* Row 3: Check-in, Check-out, Hours in a grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In
                        </p>
                        <p className="font-semibold text-gray-800">
                          {formatTime(record.checkIn)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Out
                        </p>
                        {checkOutValid ? (
                          <p className="font-semibold text-gray-800">
                            {formatTime(record.checkOut)}
                          </p>
                        ) : (
                          <p className="text-amber-600 font-semibold">In progress</p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400 mb-1 flex items-center gap-1">
                          <Timer className="w-3 h-3" /> Hours
                        </p>
                        {record.totalHours ? (
                          <p className="font-bold text-[#1B3F8B]">{record.totalHours}h</p>
                        ) : (
                          <p className="text-gray-300">—</p>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Late badge if applicable */}
                    {record.isLate && (
                      <div className="mt-2 ml-0">
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                          Late +{record.lateByMins}m
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Grand total row at the bottom */}
              <div className="rounded-xl bg-[#EFF6FF] border border-indigo-100 px-4 py-3 flex justify-between items-center">
                <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">
                  Grand Total
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-800">
                  <Timer className="w-4 h-4" />
                  {Math.round(totalHours * 100) / 100}h
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceDrawer;
