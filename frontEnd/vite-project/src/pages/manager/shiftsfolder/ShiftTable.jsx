import { Pencil, Trash2, Clock } from "lucide-react";

const ShiftTable = ({ shifts, onEdit, onDelete }) => {
  const now = new Date();

  return (
    <>
      <div className="md:hidden space-y-3">
        {shifts.map((shift) => {
          const isUpcoming = new Date(shift.shiftStartTime) > now;
          return (
            <div
              key={shift._id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {shift.shiftTitle}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Clock size={12} className="shrink-0" aria-hidden />
                    {new Date(shift.shiftStartTime).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                    isUpcoming
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-gray-700"
                  }`}
                >
                  {isUpcoming ? "Upcoming" : "Completed"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
                <div>
                  <span className="text-gray-400">Slots:</span>{" "}
                  <span className="text-gray-800 font-medium">{shift.slotsAvailable}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onEdit(shift)}
                  className="flex-1 min-h-[48px] rounded-lg border border-gray-200 text-sm font-semibold text-[#1B3F8B] hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(shift._id)}
                  className="flex-1 min-h-[48px] rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-gray-800 dark:bg-slate-900/50 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-slate-50/90 dark:border-gray-800 dark:bg-slate-800/40">
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Shift</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Slots</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {shifts.map((shift) => {
              const isUpcoming = new Date(shift.shiftStartTime) > now;

              return (
                <tr
                  key={shift._id}
                  className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {shift.shiftTitle}
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="shrink-0 text-gray-400" aria-hidden />
                      {new Date(shift.shiftStartTime).toLocaleString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{shift.slotsAvailable}</td>

                  <td className="px-6 py-4">
                    {isUpcoming ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Upcoming
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        Completed
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEdit(shift)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-[#1B3F8B] dark:hover:bg-gray-800 dark:hover:text-[#93C5FD]"
                        aria-label="Edit shift"
                      >
                        <Pencil size={16} aria-hidden />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(shift._id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
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
    </>
  );
};

export default ShiftTable;
