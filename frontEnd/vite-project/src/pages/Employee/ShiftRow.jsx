import { useState } from "react";

const ShiftRow = ({ shift, onApply, onCancel }) => {
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
            disabled={status === "applied"}
            onClick={handleApplyClick}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              status === "applied"
                ? "bg-green-100 text-green-700 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            }`}
          >
            {status === "applied" ? "Applied" : "Apply"}
          </button>

          <button
            disabled={status === "cancelled"}
            onClick={handleCancelClick}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
};

export default ShiftRow;
