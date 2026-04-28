// CancelShiftModal.jsx
// Modal for requesting to cancel / opt out of an upcoming shift.
// "Cancel" can mean either a LEAVE REQUEST (absence) or a SHIFT CHANGE REQUEST.
// Both are submitted to the manager for approval — not instant cancellations.
//
// LEAVE REQUEST     - employee asks to be absent from the shift
// SHIFT CHANGE REQUEST - employee asks to switch to a different shift

import React, { useState, useEffect } from "react";
import { LogOut as LeaveIcon, ArrowRightLeft, Loader2 } from "lucide-react";

// fmtDate - formats a date to "Mon, Mar 15, 2024"
function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

// fmtTime - formats to "09:00"
function fmtTime(d) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// CancelShiftModal - handles both leave requests and shift-change requests
//
// Props:
// isOpen       - true when the modal should be visible
// shift        - the shift the employee wants to cancel/change
// type         - "leave" | "shift_change"
// allShifts    - list of all available shifts (needed for shift_change dropdown)
// isCancelling - true while the API call is running
// onConfirm    - function called when employee submits the request
//                receives (type, data) where data = { reason } or { requestedShiftId, reason }
// onCancel     - function called to close without submitting
const CancelShiftModal = ({
  isOpen,
  shift,
  type,
  allShifts,
  isCancelling,
  onConfirm,
  onCancel,
}) => {
  // Optional reason text the employee can type
  const [reason, setReason] = useState("");

  // Selected shift to switch to (only for shift_change)
  const [requestedShiftId, setRequestedShiftId] = useState("");

  // Clear fields when modal opens for a new shift
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setRequestedShiftId("");
    }
  }, [isOpen, shift?._id]);

  if (!isOpen || !shift) return null;

  const isLeave  = type === "leave";
  const isChange = type === "shift_change";

  // Upcoming available shifts the employee can switch to
  // Filters out the current shift and past shifts
  const switchableShifts = (allShifts || []).filter(
    (s) => s._id !== shift._id && new Date(s.shiftStartTime) > Date.now()
  );

  // handleSubmit - validates and passes data to parent for API call
  function handleSubmit() {
    if (isChange && !requestedShiftId) {
      // Don't submit if no target shift selected
      return;
    }
    onConfirm(type, { requestedShiftId, reason });
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header — red for leave, amber for shift change */}
        <div className={`px-6 py-5 rounded-t-2xl ${
          isLeave
            ? "bg-gradient-to-r from-red-600 to-rose-600"
            : "bg-gradient-to-r from-amber-500 to-orange-500"
        }`}>
          <div className="flex items-center gap-3">
            {isLeave
              ? <LeaveIcon size={20} className="text-white" />
              : <ArrowRightLeft size={20} className="text-white" />}
            <div>
              <h3 className="text-white font-bold text-lg">
                {isLeave ? "Request Leave" : "Request Shift Change"}
              </h3>
              <p className="text-white/80 text-sm">{shift.shiftTitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Current shift summary */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-gray-700 mb-1">Current Shift</p>
            <p className="text-gray-500">
              {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
            </p>
          </div>

          {/* Shift change: select target shift */}
          {isChange && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Switch to Shift
              </label>
              <select
                value={requestedShiftId}
                onChange={(e) => setRequestedShiftId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 bg-gray-50"
              >
                <option value="">— Select a shift —</option>
                {switchableShifts.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.shiftTitle} · {fmtDate(s.shiftStartTime)} ({s.slotsAvailable} slots)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional reason text */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly explain why..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B] bg-gray-50"
            />
          </div>

          {/* Cancel and Submit buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCancelling || (isChange && !requestedShiftId)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 ${
                isLeave
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-md"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-md"
              }`}
            >
              {isCancelling && <Loader2 size={14} className="animate-spin" />}
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelShiftModal;
