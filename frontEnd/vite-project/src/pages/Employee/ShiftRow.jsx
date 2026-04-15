import { useState, memo } from "react";

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ShiftMobileCard({ shift, onApply, onCancel }) {
  const [status, setStatus] = useState("none");

  const handleApplyClick = async () => {
    setStatus("applied");
    try {
      await onApply(shift._id);
    } catch {
      setStatus("none");
    }
  };

  const handleCancelClick = async () => {
    setStatus("cancelled");
    try {
      await onCancel(shift._id);
    } catch {
      setStatus("none");
    }
  };

  const applied = status === "applied";
  const cancelled = status === "cancelled";
  const slots = shift.slotsAvailable ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <p className="font-semibold text-gray-900 text-sm flex-1 pr-3 leading-tight">
          {shift.shiftTitle}
        </p>
        <span
          className="
          text-xs px-2.5 py-1 rounded-full
          font-medium flex-shrink-0
          bg-blue-50 text-blue-700
          border border-blue-100
        "
        >
          {slots} left
        </span>
      </div>
      <div className="space-y-1.5 text-xs text-gray-600 mb-3">
        <div className="flex gap-2">
          <span className="text-gray-400 w-10">Start</span>
          <span className="font-medium">{formatDateTime(shift.shiftStartTime)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-10">End</span>
          <span className="font-medium">{formatDateTime(shift.shiftEndTime)}</span>
        </div>
        {shift.shiftNotes && (
          <p className="text-gray-500 mt-2 line-clamp-2 leading-relaxed">{shift.shiftNotes}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleApplyClick}
        disabled={applied || slots === 0}
        className="
          w-full min-h-11 text-sm font-semibold
          rounded-xl bg-[#1B3F8B] text-white
          hover:bg-[#152f6b] transition-colors
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        {applied
          ? "Already Applied"
          : slots === 0
            ? "Fully Booked"
            : "Apply for Shift"}
      </button>
      <button
        type="button"
        onClick={handleCancelClick}
        disabled={cancelled}
        className={`mt-2 w-full min-h-11 text-sm font-semibold rounded-xl border transition-colors ${
          cancelled
            ? "bg-red-50 text-red-600 border-red-200 cursor-not-allowed"
            : "bg-red-600 text-white border-red-600 hover:bg-red-700"
        }`}
      >
        {cancelled ? "Cancelled" : "Cancel"}
      </button>
    </div>
  );
}

function ShiftRow({ shift, onApply, onCancel }) {
  const [status, setStatus] = useState("none");

  const handleApplyClick = async () => {
    setStatus("applied");
    try {
      await onApply(shift._id);
    } catch {
      setStatus("none");
    }
  };

  const handleCancelClick = async () => {
    setStatus("cancelled");
    try {
      await onCancel(shift._id);
    } catch {
      setStatus("none");
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-slate-900">{shift.shiftTitle}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-slate-600">
          {new Date(shift.shiftStartTime).toLocaleString("en-GB")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-slate-600">
          {new Date(shift.shiftEndTime).toLocaleString("en-GB")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-slate-600">{shift.slotsAvailable}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={status === "applied"}
            onClick={handleApplyClick}
            className={`min-h-11 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              status === "applied"
                ? "bg-green-100 text-green-700 cursor-not-allowed"
                : "bg-[#1B3F8B] text-white hover:bg-[#162d5e] shadow-sm"
            }`}
          >
            {status === "applied" ? "Applied" : "Apply"}
          </button>

          <button
            type="button"
            disabled={status === "cancelled"}
            onClick={handleCancelClick}
            className={`min-h-11 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              status === "cancelled"
                ? "bg-red-100 text-red-700 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
            }`}
          >
            {status === "cancelled" ? "Cancelled" : "Cancel"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(ShiftRow);
