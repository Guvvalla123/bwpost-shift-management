import { useState, memo } from "react";
import { CalendarDays, Clock, Loader2 } from "lucide-react";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const secondaryBtnCls =
  "min-h-11 text-sm font-medium rounded-xl border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors";

export function ShiftMobileCard({ shift, onApply, onCancel }) {
  const [status, setStatus] = useState("none");
  const [applying, setApplying] = useState(false);

  const handleApplyClick = async () => {
    setApplying(true);
    setStatus("applied");
    try {
      await onApply(shift._id);
    } catch {
      setStatus("none");
    } finally {
      setApplying(false);
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

  const slotBadge =
    slots === 0
      ? null
      : slots === 1
        ? { label: "1 slot left", cls: "bg-red-50 text-red-700 border-red-100" }
        : slots <= 3
          ? { label: `${slots} slots left`, cls: "bg-amber-50 text-amber-700 border-amber-100" }
          : { label: `${slots} slots`, cls: "bg-green-50 text-green-700 border-green-100" };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
      <div className="p-4 pb-3">
        {/* TOP ROW: title + urgency slot badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-tight text-gray-900 flex-1 min-w-0 truncate">
            {shift.shiftTitle}
          </h3>
          {slotBadge ? (
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${slotBadge.cls}`}>
              {slotBadge.label}
            </span>
          ) : (
            <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border bg-gray-50 text-gray-500 border-gray-200 whitespace-nowrap">
              Full
            </span>
          )}
        </div>

        {/* SECOND ROW: date and time */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>{fmtDate(shift.shiftStartTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>{fmtTime(shift.shiftStartTime)} – {fmtTime(shift.shiftEndTime)}</span>
          </div>
        </div>

        {/* THIRD ROW: notes */}
        {shift.shiftNotes && (
          <p className="mt-2.5 text-sm text-gray-400 italic leading-relaxed line-clamp-2">
            {shift.shiftNotes}
          </p>
        )}
      </div>

      {/* BOTTOM ROW: apply / withdraw buttons */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
        {applied ? (
          <div className="w-full min-h-11 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-500 cursor-not-allowed">
            Applied
          </div>
        ) : (
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={applying || slots === 0}
            className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] text-sm font-semibold text-white transition-all duration-150 hover:bg-[#152f6b] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
          >
            {applying && <Loader2 className="h-4 w-4 animate-spin" />}
            {slots === 0 ? "Fully Booked" : "Apply for Shift"}
          </button>
        )}
        <button
          type="button"
          onClick={handleSecondaryClick}
          disabled={withdrawn}
          className={`w-full min-h-11 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 bg-white transition-all duration-150 hover:bg-gray-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 ${withdrawn ? "opacity-50 cursor-not-allowed" : ""}`}
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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">{shift.shiftTitle}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-600">
          {new Date(shift.shiftStartTime).toLocaleString("en-GB")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-600">
          {new Date(shift.shiftEndTime).toLocaleString("en-GB")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-600">{shift.slotsAvailable}</span>
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
