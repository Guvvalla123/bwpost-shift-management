import { useState, memo } from "react";

const formatShiftDateTime = (iso) =>
  new Date(iso).toLocaleString("en-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const secondaryBtnCls =
  "min-h-11 text-sm font-medium rounded-xl border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors";

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

  const handleSecondaryClick = async () => {
    if (status !== "applied") return;
    if (!window.confirm("Withdraw your application for this shift?")) return;
    setStatus("withdrawn");
    try {
      await onCancel(shift._id);
    } catch {
      setStatus("applied");
    }
  };

  const applied = status === "applied";
  const withdrawn = status === "withdrawn";
  const slots = shift.slotsAvailable ?? 0;
  const statusLabel = `${slots} left`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {shift.shiftTitle}
            </h3>
          </div>
          <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
            {statusLabel}
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="text-gray-400 w-8 flex-shrink-0 font-medium">Start</span>
            <span className="font-medium text-gray-800">{formatShiftDateTime(shift.shiftStartTime)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="text-gray-400 w-8 flex-shrink-0 font-medium">End</span>
            <span className="font-medium text-gray-800">{formatShiftDateTime(shift.shiftEndTime)}</span>
          </div>
        </div>

        {shift.shiftNotes && (
          <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">{shift.shiftNotes}</p>
        )}
      </div>

      <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={applied || slots === 0}
          className="
            w-full min-h-11 text-sm font-semibold rounded-xl bg-[#1B3F8B] text-white
            hover:bg-[#152f6b] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
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
          onClick={handleSecondaryClick}
          disabled={withdrawn}
          className={`w-full ${secondaryBtnCls} ${withdrawn ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {withdrawn ? "Withdrawn" : applied ? "Withdraw" : "Close"}
        </button>
      </div>
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

  const handleSecondaryClick = async () => {
    if (status !== "applied") return;
    if (!window.confirm("Withdraw your application for this shift?")) return;
    setStatus("withdrawn");
    try {
      await onCancel(shift._id);
    } catch {
      setStatus("applied");
    }
  };

  const applied = status === "applied";
  const withdrawn = status === "withdrawn";

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
            disabled={applied}
            onClick={handleApplyClick}
            className={`min-h-11 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              applied
                ? "bg-green-100 text-green-700 cursor-not-allowed"
                : "bg-[#1B3F8B] text-white hover:bg-[#162d5e] shadow-sm"
            }`}
          >
            {applied ? "Applied" : "Apply"}
          </button>

          <button
            type="button"
            disabled={withdrawn}
            onClick={handleSecondaryClick}
            className={`min-h-11 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              withdrawn
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 text-gray-600 bg-white hover:bg-gray-50"
            }`}
          >
            {withdrawn ? "Withdrawn" : applied ? "Withdraw" : "Close"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(ShiftRow);
