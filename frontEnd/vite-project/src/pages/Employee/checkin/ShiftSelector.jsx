// ShiftSelector.jsx
// Shows a dropdown for selecting which shift to check in to.
// Only shown when the employee has more than one active shift today.
// If there is only one shift, it is auto-selected in CheckInPage.

import React from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

// formatTime - formats a date string to "9:00 AM" style
function formatTime(d) {
  return d
    ? new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
    : "—";
}

// ShiftSelector - dropdown to pick which shift to check in to
//
// Props:
// shifts          - list of active shift objects available today
// selectedShiftId - the _id of the currently selected shift
//                   null or empty string means nothing is selected
// onSelectShift   - function called when employee picks a shift
//                   receives the selected shift _id string
const ShiftSelector = ({ shifts, selectedShiftId, onSelectShift }) => {
  // Don't render if there is only one or zero shifts
  // (single shift is auto-selected in CheckInPage)
  if (!shifts || shifts.length <= 1) return null;

  return (
    <div>
      {/* Label */}
      <label className="mb-1.5 block text-sm font-semibold text-gray-600">
        Select shift
      </label>

      {/* Dropdown with chevron icon */}
      <div className="relative">
        <select
          value={selectedShiftId || ""}
          onChange={(e) => onSelectShift(e.target.value || null)}
          className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-800 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
        >
          <option value="">Choose a shift</option>
          {shifts.map((s) => (
            <option key={s._id} value={s._id}>
              {s.shiftTitle} · {formatTime(s.shiftStartTime)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Warning if no shift selected yet */}
      {!selectedShiftId && (
        <p className="mt-2 flex items-center gap-2 text-base text-amber-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Select a shift to continue.
        </p>
      )}
    </div>
  );
};

export default ShiftSelector;
