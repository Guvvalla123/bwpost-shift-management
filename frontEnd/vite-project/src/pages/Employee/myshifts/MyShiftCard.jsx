// MyShiftCard.jsx
// Shows ONE shift as a card on mobile screens.
// Displays shift title, status badge, date, time, and action buttons.
// For upcoming shifts: shows change and leave request buttons.

import React from "react";
import { CalendarDays, Clock, Eye, ArrowRightLeft, LogOut as LeaveIcon } from "lucide-react";
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

// MyShiftCard - mobile card for one employee shift
//
// Props:
// shift          - the shift object to display
// onViewDetails  - function called when the eye (view) button is clicked
//                  opens the MyShiftDetails side panel
// onRequestLeave - function called when the leave button is clicked
//                  opens the CancelShiftModal with type "leave"
// onRequestChange - function called when the change button is clicked
//                  opens the CancelShiftModal with type "shift_change"
const MyShiftCard = ({ shift, onViewDetails, onRequestLeave, onRequestChange }) => {
  const apiStatus = getStatus(shift.shiftStartTime, shift.shiftEndTime);

  // Left border color shows status at a glance
  const borderCls =
    apiStatus === "ongoing"   ? "border-l-4 border-l-green-500" :
    apiStatus === "upcoming"  ? "border-l-4 border-l-[#1B3F8B]" :
    "border-l-4 border-l-gray-300";

  // Badge variant per status
  const badgeVariant =
    apiStatus === "ongoing"  ? "success" :
    apiStatus === "upcoming" ? "navy"    : "gray";

  const badgeLabel =
    apiStatus === "ongoing"  ? "Ongoing"   :
    apiStatus === "upcoming" ? "Upcoming"  : "Completed";

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 ${borderCls}`}>
      {/* TOP ROW: title + status badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-bold text-base text-gray-900 leading-tight flex-1 min-w-0 truncate">
          {shift.shiftTitle}
        </p>
        <Badge variant={badgeVariant} size="sm">{badgeLabel}</Badge>
      </div>

      {/* SECOND ROW: date and time */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{fmtDate(shift.shiftStartTime)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{fmtTime(shift.shiftStartTime)} – {fmtTime(shift.shiftEndTime)}</span>
        </div>
      </div>

      {/* Shift notes (if any) */}
      {shift.shiftNotes && (
        <p className="text-sm text-gray-400 italic truncate mb-3">{shift.shiftNotes}</p>
      )}

      {/* BOTTOM ROW: action buttons */}
      <div className="flex items-center justify-end gap-0.5 border-t border-gray-100 pt-3">
        {/* View details button */}
        <button
          type="button"
          title="View details"
          onClick={() => onViewDetails && onViewDetails(shift)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1B3F8B] transition-colors duration-150"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Upcoming-only: shift change and leave buttons */}
        {apiStatus === "upcoming" && (
          <>
            <button
              type="button"
              title="Request shift change"
              onClick={() => onRequestChange && onRequestChange(shift)}
              className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors duration-150"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Request leave"
              onClick={() => onRequestLeave && onRequestLeave(shift)}
              className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
            >
              <LeaveIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MyShiftCard;
