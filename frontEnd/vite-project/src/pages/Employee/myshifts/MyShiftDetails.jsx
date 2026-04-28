// MyShiftDetails.jsx
// Side panel showing full details for a selected shift.
// Slides in from the right when employee clicks the eye button.
// Shows shift title, date, time, notes, manager, and status.

import React from "react";
import { X, CalendarDays, Clock, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui";
import { getStatus } from "@/utils/shiftStatus";

// fmtDate - formats a date to "Wed, Mar 15, 2024"
function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

// fmtTime - formats a date to "09:00"
function fmtTime(d) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// MyShiftDetails - side panel showing full details for a shift
//
// Props:
// shift   - shift object to show details for
//           when null, the panel is hidden
// onClose - function called to close the panel
const MyShiftDetails = ({ shift, onClose }) => {
  // Don't render if no shift selected
  if (!shift) return null;

  const apiStatus = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const badgeVariant =
    apiStatus === "ongoing"  ? "success" :
    apiStatus === "upcoming" ? "navy"    : "gray";
  const badgeLabel =
    apiStatus === "ongoing"  ? "Ongoing"  :
    apiStatus === "upcoming" ? "Upcoming" : "Completed";

  // Get manager name from the shift object
  const managerName = (() => {
    const m = shift?.manager || shift?.managerId;
    if (!m) return null;
    if (typeof m === "object") return m.username || m.email || null;
    return null;
  })();

  return (
    // Dark backdrop — clicking it closes the panel
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      {/* Slide-in panel from the right */}
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue gradient header */}
        <div className="bg-gradient-to-r from-[#1B3F8B] to-[#162d5e] px-6 pt-8 pb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/70 mb-1">Shift Details</p>
              <h2 className="text-xl font-bold text-white leading-tight truncate">
                {shift.shiftTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition text-white shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Status badge */}
          <div className="mt-3">
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
        </div>

        {/* Details content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Date row */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-[#1B3F8B]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</p>
              <p className="text-sm font-semibold text-gray-800">{fmtDate(shift.shiftStartTime)}</p>
            </div>
          </div>

          {/* Time row */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-[#1B3F8B]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Time</p>
              <p className="text-sm font-semibold text-gray-800">
                {fmtTime(shift.shiftStartTime)} – {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
          </div>

          {/* Manager row (if available) */}
          {managerName && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-[#1B3F8B]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Manager</p>
                <p className="text-sm font-semibold text-gray-800">{managerName}</p>
              </div>
            </div>
          )}

          {/* Notes (if any) */}
          {shift.shiftNotes && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="h-4 w-4 text-[#1B3F8B]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5">{shift.shiftNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer close button */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 text-gray-700 font-medium rounded-xl hover:bg-slate-200 transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyShiftDetails;
