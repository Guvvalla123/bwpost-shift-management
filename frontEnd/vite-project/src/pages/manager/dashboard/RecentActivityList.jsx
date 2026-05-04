// RecentActivityList.jsx
// Shows the 5 most recent shifts in the right column of the dashboard.
// Each item shows shift title, date/time, filled slots, and a status pill.
// Clicking a shift item opens the shift details panel.

import React from "react";
import { getStatus } from "@/utils/shiftStatus";

// fmtDate - formats to "Mar 15, 2024"
function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}
// fmtTime - formats to "09:00"
function fmtTime(d) {
  return d
    ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "—";
}

// getListStatusStyle - returns pill style and label for a shift status key
function getListStatusStyle(key) {
  if (key === "ongoing")  return { pill: "bg-emerald-100 text-emerald-800", label: "Live" };
  if (key === "upcoming") return { pill: "bg-blue-100 text-blue-800",       label: "Soon" };
  return                         { pill: "bg-gray-100 text-gray-600",       label: "Done" };
}

// RecentActivityList - list of 5 recent shifts with clickable rows
//
// Props:
// recentShifts  - array of shift objects to show (max 5 shown)
// onViewShift   - function called when a shift row is clicked
//                 receives the shift object
// onViewAll     - function called when "View all" button is clicked
const RecentActivityList = ({ recentShifts, onViewShift, onViewAll }) => {
  // Show only the first 5 shifts
  const recentFive = (recentShifts || []).slice(0, 5);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header row with title and View all link */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-[#1B3F8B] hover:underline transition-colors duration-150 active:scale-95"
        >
          View all
        </button>
      </div>

      {/* Shift rows */}
      <div className="flex flex-1 flex-col divide-y divide-gray-50 p-3">
        {recentFive.length > 0 ? (
          recentFive.map((shift) => {
            const filled     = shift.acceptedEmployees?.length || 0;
            const openSlots  = shift.slotsAvailable ?? 0;
            const totalSlots = filled + openSlots;
            const fillPct    = totalSlots > 0 ? Math.round((filled / totalSlots) * 100) : 0;{/* fillPct is the percentage of the shift that is filled /Progress bar*/}            const statusKey  = getStatus(shift.shiftStartTime, shift.shiftEndTime);
            const { pill, label } = getListStatusStyle(statusKey);

            return (
              <button
                type="button"
                key={shift._id}
                onClick={() => onViewShift(shift)}
                className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-100 first:pt-2 last:pb-2 hover:bg-gray-50/80 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{shift.shiftTitle}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)}
                  </p>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {filled} of {totalSlots} filled
                  </p>
                  {/* Fill progress bar */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#1B3F8B] transition-all"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${pill}`}>
                  {label}
                </span>
              </button>
            );
          })
        ) : (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-400">No recent shifts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityList;
