// RejectNoteModal.jsx
// Shows when manager clicks the Reject button on a request.
// Manager can optionally add a note explaining why they are rejecting.
// The note is sent to the employee so they understand the decision.
// Note is optional — manager can reject without writing anything.

import React, { useState, useEffect } from "react";
import { XCircle, Loader2 } from "lucide-react";

// fmtDate - formats a date string to "Month Day, Year"
function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

// RejectNoteModal - bottom sheet modal for rejecting a request with optional note
//
// Props:
// isOpen    - true when the modal should be visible on screen
// request   - the request object being rejected
//             used to show the employee name and shift summary
// onConfirm - function called with the note text when manager confirms
//             receives (note) as argument — note can be empty string
// onCancel  - function called when manager clicks Cancel
//             closes the modal without rejecting
const RejectNoteModal = ({ isOpen, request, onConfirm, onCancel }) => {
  // Text typed in the note field — optional
  const [note, setNote] = useState("");

  // True while the reject API call is running
  const [busy, setBusy] = useState(false);

  // Clear the note when a new request is opened
  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen, request?._id]);

  // Don't render if not open or no request
  if (!isOpen || !request) return null;

  // handleConfirm - passes the note to the parent and handles loading state
  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm(note);
    } finally {
      setBusy(false);
    }
  }

  return (
    // Dark backdrop — slides up from bottom on mobile, centered on desktop
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Modal panel */}
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto md:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" aria-hidden />

        {/* Red gradient header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <XCircle size={20} className="text-white" />
            <div>
              <h3 className="text-white font-bold text-base">Reject Request</h3>
              <p className="text-white/75 text-xs mt-0.5">
                {request.employee?.username} — {request.type === "shift_change" ? "Shift Change" : "Leave"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Request summary box */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Request Summary
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">From:</span>{" "}
              {request.currentShift?.shiftTitle} ({fmtDate(request.currentShift?.shiftStartTime)})
            </p>
            {request.requestedShift && (
              <p className="text-gray-600">
                <span className="font-semibold">To:</span>{" "}
                {request.requestedShift?.shiftTitle} ({fmtDate(request.requestedShift?.shiftStartTime)})
              </p>
            )}
            {request.reason && (
              <p className="text-gray-500 italic">"{request.reason}"</p>
            )}
          </div>

          {/* Optional note field */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Note to Employee (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. We need full coverage that day."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B] bg-gray-50"
            />
          </div>

          {/* Cancel and Reject buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-nowrap">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="w-full sm:flex-1 px-4 py-3 min-h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 disabled:opacity-60 transition-all"
            >
              {busy && <Loader2 size={13} className="animate-spin" />}
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectNoteModal;
