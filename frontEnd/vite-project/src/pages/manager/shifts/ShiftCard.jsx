// ShiftCard.jsx
// Shows ONE shift as a card on mobile screens.
// Each card has a colored left border based on shift status:
//   Green border  = ongoing shift
//   Blue border   = upcoming and full
//   Amber border  = upcoming with open slots (needs staff)
//   Gray border   = completed shift
//
// Manager can view, edit or delete from the buttons at the bottom.
// Clicking anywhere on the card also opens the details panel.

import React from "react";
import { CalendarDays, Clock, Eye, Pencil, Trash2 } from "lucide-react";
import { getStatus } from "@/utils/shiftStatus";

// STATUS_CONFIG - defines the label, colors for each shift status
// Used to show the status badge on each card
const STATUS_CONFIG = {
  upcoming: {
    label: "Upcoming",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  ongoing: {
    label: "Ongoing",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

// formatDate - converts an ISO date string to "Jan 5, 2025" format
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// formatTime - converts an ISO date string to "09:00 AM" format
const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

// getCardBorderColor - returns the left border color class based on shift status
// Ongoing = green, Completed = gray, Upcoming with slots = amber, Upcoming full = blue
const getCardBorderColor = (shift) => {
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const openSlots = Number(shift.slotsAvailable) || 0;
  if (status === "ongoing")                          return "border-l-green-500";
  if (status === "completed")                        return "border-l-gray-300";
  if (status === "upcoming" && openSlots > 0)        return "border-l-amber-500";
  if (status === "upcoming")                         return "border-l-[#1B3F8B]";
  return "border-l-gray-300";
};

// ShiftCard - one shift card for mobile screens
//
// Props:
// shift    - the shift object to display
//            contains: shiftTitle, shiftStartTime, shiftEndTime,
//            slotsAvailable, acceptedEmployees, shiftNotes
// onView   - function called when the card is clicked or eye button pressed
//            opens the shift details side panel in ShiftsPage.jsx
// onEdit   - function called when the edit (pencil) button is pressed
//            opens the edit shift form in ShiftsPage.jsx
// onDelete - function called when the delete (trash) button is pressed
//            opens the delete confirmation dialog in ShiftsPage.jsx
const ShiftCard = ({ shift, onView, onEdit, onDelete }) => {
  // Calculate how filled this shift is
  const totalSlots = Number(shift.slotsAvailable) || 0;
  const filledSlots = shift.acceptedEmployees?.length || 0;
  const fillPercent = Math.min(Math.round((filledSlots / Math.max(totalSlots, 1)) * 100), 100);

  // Get the current status of this shift
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const statusStyle = STATUS_CONFIG[status];

  return (
    <div
      role="button"
      tabIndex={0}
      // Clicking anywhere on the card opens the details panel
      onClick={() => onView(shift)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(shift);
        }
      }}
      className={`cursor-pointer rounded-2xl border border-gray-100 border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${getCardBorderColor(shift)}`}
    >
      {/* TOP ROW: shift title + status badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-base font-bold leading-tight text-gray-900">{shift.shiftTitle}</p>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
        >
          {/* Pulsing dot for ongoing shifts, static dot for others */}
          {status === "ongoing" ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${statusStyle.dot}`} />
            </span>
          ) : (
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
          )}
          {statusStyle.label}
        </span>
      </div>

      {/* SECOND ROW: date and time */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{formatDate(shift.shiftStartTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>
            {formatTime(shift.shiftStartTime)} – {formatTime(shift.shiftEndTime)}
          </span>
        </div>
      </div>

      {/* THIRD ROW: slots filled count + progress bar */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>{filledSlots} of {totalSlots} filled</span>
          <span className="tabular-nums font-medium">{fillPercent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              fillPercent >= 100 ? "bg-green-500" : fillPercent >= 50 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* BOTTOM ROW: action icon buttons */}
      <div className="flex items-center justify-end gap-0.5 border-t border-gray-100 pt-3">
        {/* Eye button — view shift details */}
        <button
          type="button"
          title="View details"
          onClick={(e) => { e.stopPropagation(); onView(shift); }}
          className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Pencil button — edit shift */}
        <button
          type="button"
          title="Edit shift"
          onClick={(e) => { e.stopPropagation(); onEdit(shift); }}
          className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-[#EFF6FF] hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Trash button — delete shift */}
        <button
          type="button"
          title="Delete shift"
          onClick={(e) => { e.stopPropagation(); onDelete(shift); }}
          className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ShiftCard;
