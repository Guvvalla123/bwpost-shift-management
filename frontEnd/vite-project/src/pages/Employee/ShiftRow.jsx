import { useState, memo } from "react";
import { Clock } from "lucide-react";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function ShiftRowStatusBadge({ status }) {
  if (status === "applied") {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 shrink-0">
        Applied
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 shrink-0">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 shrink-0">
      Open
    </span>
  );
}

function ShiftRow({ shift, onApply, onCancel }) {
  const [status, setStatus] = useState("none");
  // "none" | "applied" | "cancelled"

  const handleApplyClick = async () => {
    setStatus("applied");
    try {
      await onApply(shift._id);
    } catch (error) {
      setStatus("none");
    }
  };

  const handleCancelClick = async () => {
    setStatus("cancelled");
    try {
      await onCancel(shift._id);
    } catch (error) {
      setStatus("none");
    }
  };

  const badgeStatus = status === "applied" ? "applied" : status === "cancelled" ? "cancelled" : "open";

  const btnApplyCls =
    status === "applied"
      ? "bg-green-100 text-green-700 cursor-not-allowed"
      : "bg-[#1B3F8B] text-white hover:bg-[#162d5e] shadow-sm";
  const btnCancelCls =
    status === "cancelled"
      ? "bg-red-100 text-red-700 cursor-not-allowed"
      : "bg-red-600 text-white hover:bg-red-700 shadow-sm";

  return (
    <>
      <tr className="sm:hidden">
        <td colSpan={5} className="px-4 py-3 border-b border-slate-100">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{shift.shiftTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(shift.shiftStartTime)}</p>
              </div>
              <ShiftRowStatusBadge status={badgeStatus} />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 shrink-0" aria-hidden />
              <span>
                {formatTime(shift.shiftStartTime)} — {formatTime(shift.shiftEndTime)}
              </span>
            </div>
            <div className="text-sm text-slate-500">{shift.slotsAvailable} slots available</div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={status === "applied"}
                onClick={handleApplyClick}
                className={`w-full min-h-12 py-3 rounded-lg text-base font-medium transition-colors ${btnApplyCls}`}
              >
                {status === "applied" ? "Applied" : "Apply"}
              </button>
              <button
                type="button"
                disabled={status === "cancelled"}
                onClick={handleCancelClick}
                className={`w-full min-h-12 py-3 rounded-lg text-base font-medium transition-colors ${btnCancelCls}`}
              >
                {status === "cancelled" ? "Cancelled" : "Cancel"}
              </button>
            </div>
          </div>
        </td>
      </tr>
      <tr className="hidden sm:table-row hover:bg-slate-50 transition-colors">
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
    </>
  );
}

export default memo(ShiftRow);
