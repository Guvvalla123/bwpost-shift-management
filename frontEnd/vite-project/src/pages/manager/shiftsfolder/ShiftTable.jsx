import { Pencil, Trash2, Clock } from "lucide-react";

const ShiftTable = ({ shifts, onEdit, onDelete }) => {
  const now = new Date();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/40">
          <tr className="text-left text-slate-500 dark:text-slate-400">
            <th className="px-6 py-3 font-medium">Shift</th>
            <th className="px-6 py-3 font-medium">Date & Time</th>
            <th className="px-6 py-3 font-medium">Slots</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {shifts.map((shift) => {
            const isUpcoming = new Date(shift.shiftStartTime) > now;

            return (
              <tr
                key={shift._id}
                className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                  {shift.shiftTitle}
                </td>

                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="shrink-0 text-slate-400" aria-hidden />
                    {new Date(shift.shiftStartTime).toLocaleString()}
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{shift.slotsAvailable}</td>

                <td className="px-6 py-4">
                  {isUpcoming ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Upcoming
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Completed
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(shift)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#1B3F8B] dark:hover:bg-slate-800 dark:hover:text-[#93C5FD]"
                      aria-label="Edit shift"
                    >
                      <Pencil size={16} aria-hidden />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(shift._id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      aria-label="Delete shift"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ShiftTable;
