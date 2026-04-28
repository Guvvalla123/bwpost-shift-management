// CheckInButton.jsx
// Shows the main action buttons for check-in, check-out, and breaks.
// The buttons shown depend on the employee's current attendance status.
//
// STATUS FLOW:
// not_started → check in button
// checked_in  → start break dropdown + check out button
// on_break    → end break button
// checked_out → summary card (no buttons — shift complete)

import React, { useState } from "react";
import {
  Clock, Coffee, CheckCircle2, Loader2,
} from "lucide-react";

// formatTime - formats ISO date to readable time like "9:00 AM"
function formatTime(d) {
  return d
    ? new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
    : "—";
}

// formatDuration - converts minutes to human-readable time string
function formatDuration(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return "—";
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} minutes`;
  return r === 0 ? `${h} hours` : `${h} hours ${r} minutes`;
}

// STATUS_BADGE - badge style config per status
const STATUS_BADGE = {
  not_started: { label: "Not Started", cls: "bg-slate-100 text-gray-700" },
  checked_in:  { label: "Checked In",  cls: "bg-emerald-100 text-emerald-700" },
  on_break:    { label: "On Break",    cls: "bg-amber-100 text-amber-700" },
  checked_out: { label: "Completed",   cls: "bg-blue-100 text-blue-700" },
};

// CheckInButton - renders the appropriate action buttons for the current status
//
// Props:
// attendance        - the current attendance record object
//                     null means employee has not checked in yet
// isLoading         - true while any API call is running
//                     disables all buttons
// firstCheckIn      - timestamp of the first check-in (from work sessions)
// lastCheckOut      - timestamp of the last check-out
// minutesSinceIn    - how many minutes since employee checked in
// breakDurationMins - how many minutes the current break has lasted
// onCheckIn         - function called when Check In is clicked
// onCheckOut        - function called when Check Out is confirmed
// onStartBreak      - function called with breakType when break starts
//                     breakType is "lunch" or "short_break"
// onEndBreak        - function called when End Break is clicked
const CheckInButton = ({
  attendance,
  isLoading,
  firstCheckIn,
  lastCheckOut,
  minutesSinceIn,
  breakDurationMins,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
}) => {
  // Whether the break type dropdown menu is visible
  const [showBreakMenu, setShowBreakMenu] = useState(false);

  const status = attendance?.status || "not_started";
  const badge  = STATUS_BADGE[status] || STATUS_BADGE.not_started;

  return (
    <>
      {/* Status badge row */}
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <span className="text-sm text-gray-600">Status</span>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* ── not_started: show Check In button ── */}
      {status === "not_started" && (
        <button
          type="button"
          onClick={onCheckIn}
          disabled={isLoading}
          className="flex h-14 min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] text-white shadow-md transition-all duration-150 hover:bg-[#162d5e] active:scale-95 disabled:opacity-60"
        >
          {isLoading
            ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            : <Clock className="h-5 w-5 shrink-0" strokeWidth={2} />}
          <span className="text-sm font-bold">
            {isLoading ? "Checking in…" : "Check In"}
          </span>
        </button>
      )}

      {/* ── checked_in or on_break: show status info card ── */}
      {(status === "checked_in" || status === "on_break") && (
        <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Checked in</p>
              {firstCheckIn && (
                <p className="text-sm text-emerald-800">
                  Checked in at {formatTime(firstCheckIn)}
                </p>
              )}
              {minutesSinceIn != null && status === "checked_in" && (
                <p className="mt-1 text-sm text-emerald-800">
                  Time worked: {formatDuration(minutesSinceIn)}
                </p>
              )}
              {breakDurationMins != null && status === "on_break" && (
                <p className="mt-1 text-sm text-amber-800">
                  On break: {formatDuration(breakDurationMins)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── checked_in: Break + Check Out buttons ── */}
      {status === "checked_in" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Start Break button with dropdown */}
          <div className="relative w-full sm:flex-1">
            <button
              type="button"
              onClick={() => setShowBreakMenu((v) => !v)}
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-60 transition-all duration-150"
            >
              <Coffee className="h-5 w-5 shrink-0" />
              Start Break
            </button>

            {/* Break type dropdown menu */}
            {showBreakMenu && (
              <>
                {/* Invisible overlay to close dropdown on outside click */}
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setShowBreakMenu(false)}
                />
                <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-gray-200 bg-white py-1 text-base shadow-lg">
                  <button
                    type="button"
                    className="w-full min-h-11 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-100"
                    onClick={() => { onStartBreak("lunch"); setShowBreakMenu(false); }}
                  >
                    Lunch Break
                  </button>
                  <button
                    type="button"
                    className="w-full min-h-11 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-100"
                    onClick={() => { onStartBreak("short_break"); setShowBreakMenu(false); }}
                  >
                    Short Break
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Check Out button */}
          <button
            type="button"
            onClick={onCheckOut}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white hover:bg-[#162d5e] active:scale-95 disabled:opacity-60 transition-all duration-150 sm:flex-1"
          >
            {isLoading
              ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
              : <Clock className="h-5 w-5 shrink-0" />}
            {isLoading ? "Processing…" : "Check Out"}
          </button>
        </div>
      )}

      {/* ── on_break: End Break button ── */}
      {status === "on_break" && (
        <button
          type="button"
          onClick={onEndBreak}
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white hover:bg-[#162d5e] active:scale-95 disabled:opacity-60 transition-all duration-150"
        >
          {isLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
          {isLoading ? "Ending break…" : "End Break"}
        </button>
      )}

      {/* ── checked_in or on_break: Today's attendance summary ── */}
      {(status === "checked_in" || status === "on_break") && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Today</p>
          <dl className="mt-3 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Check in</dt>
              <dd className="font-medium">{firstCheckIn ? formatTime(firstCheckIn) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Check out</dt>
              <dd className="font-medium">{lastCheckOut ? formatTime(lastCheckOut) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Total worked</dt>
              <dd className="font-semibold tabular-nums">
                {attendance?.totalWorkMinutes != null
                  ? formatDuration(attendance.totalWorkMinutes)
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* ── checked_out: Shift complete summary ── */}
      {status === "checked_out" && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
          <div className="flex items-center gap-2 text-base font-bold text-emerald-800">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            Shift complete
          </div>
          <dl className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Check in</dt>
              <dd className="font-medium">{firstCheckIn ? formatTime(firstCheckIn) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Check out</dt>
              <dd className="font-medium">{lastCheckOut ? formatTime(lastCheckOut) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Total hours</dt>
              <dd className="font-semibold">
                {attendance?.totalWorkMinutes != null
                  ? formatDuration(attendance.totalWorkMinutes)
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
};

export default CheckInButton;
