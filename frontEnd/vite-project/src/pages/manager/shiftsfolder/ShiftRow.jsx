import React, { memo } from "react";

function ShiftRow({ shift, onEdit, onDelete }) {
  return (
    <tr className="border-b border-gray-100 transition hover:bg-slate-50/80 dark:border-gray-800 dark:hover:bg-slate-800/40">
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{shift.shiftTitle}</td>

      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
        {new Date(shift.shiftStartTime).toLocaleString("en-GB")}
      </td>

      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
        {new Date(shift.shiftEndTime).toLocaleString("en-GB")}
      </td>

      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{shift.slotsAvailable}</td>

      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2 rounded-lg bg-slate-50/90 p-2 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={() => onEdit(shift)}
            className="inline-flex h-8 items-center rounded-lg bg-[#1B3F8B] px-3 text-xs font-medium text-white transition hover:bg-[#162d5e]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(shift._id)}
            className="inline-flex h-8 items-center rounded-lg bg-rose-600 px-3 text-xs font-medium text-white transition hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(ShiftRow);
