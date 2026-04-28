// EmployeeShiftModal.jsx
// Side sheet showing one shift summary and quick actions when status is upcoming.

import React from "react";
import { X, ArrowRightLeft, LogOut as LeaveIcon } from "lucide-react";
import { getStatus } from "@/utils/shiftStatus";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS_UI = {
  upcoming: {
    label: "Upcoming",
    cls: "bg-[#EFF6FF] text-[#1B3F8B]",
    dot: "bg-[#1B3F8B]",
  },
  ongoing: {
    label: "Ongoing",
    cls: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500 animate-pulse",
  },
  completed: {
    label: "Completed",
    cls: "bg-slate-100 text-gray-500",
    dot: "bg-slate-400",
  },
};

// EmployeeShiftModal — matches previous inline ShiftModal component
function EmployeeShiftModal({ shift, onClose, onLeave, onChange }) {
  if (!shift) return null;
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const st = STATUS_UI[status];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4 sm:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white h-full w-full sm:w-[420px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>

        <div className="bg-gradient-to-br from-[#1B3F8B] via-[#1B3F8B] to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight">{shift.shiftTitle}</h2>
              <p className="text-white/70 text-sm mt-2">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors duration-150 active:scale-95 text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {shift.shiftNotes && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-gray-700 leading-relaxed">{shift.shiftNotes}</p>
          </div>
        )}

        {shift.createdByManager && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Posted By</p>
            <p className="text-sm font-semibold text-gray-700">{shift.createdByManager.username || "Manager"}</p>
          </div>
        )}

        {status === "upcoming" && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Actions</p>
            <button
              type="button"
              onClick={() => { onChange(shift); onClose(); }}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
            >
              <ArrowRightLeft size={15} />
              Request Shift Change
            </button>
            <button
              type="button"
              onClick={() => { onLeave(shift); onClose(); }}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <LeaveIcon size={15} />
              Request Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeShiftModal;
