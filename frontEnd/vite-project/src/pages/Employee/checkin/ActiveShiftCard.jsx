// ActiveShiftCard.jsx
// Shows the currently selected shift as a blue card.
// Displays shift title, start and end times, and a progress bar
// showing how much of the shift has elapsed so far.

import React from "react";

// formatTime - formats ISO date to readable time like "9:00 AM"
function formatTime(d) {
  return d
    ? new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
    : "—";
}

// ActiveShiftCard - blue card showing shift details and time progress
//
// Props:
// shift          - the shift object currently selected
//                  must have: shiftTitle, shiftStartTime, shiftEndTime
// progressPct    - number 0–100 representing how far through the shift we are
//                  calculated in CheckInPage using the live clock
const ActiveShiftCard = ({ shift, progressPct }) => {
  if (!shift) return null;

  return (
    <div className="overflow-hidden rounded-2xl bg-[#1B3F8B] text-white shadow-lg">
      <div className="p-5 sm:p-6">
        {/* Label */}
        <p className="text-xs font-medium text-white/70">Current shift</p>

        {/* Shift title */}
        <h2 className="mt-1 text-xl font-bold leading-tight sm:text-2xl">
          {shift.shiftTitle}
        </h2>

        {/* Start and end times */}
        <p className="mt-2 text-sm text-white/85">
          {formatTime(shift.shiftStartTime)} – {formatTime(shift.shiftEndTime)}
        </p>

        {/* Progress bar showing elapsed shift time */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-white/70">
            <span>Shift progress</span>
            <span className="tabular-nums">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveShiftCard;
