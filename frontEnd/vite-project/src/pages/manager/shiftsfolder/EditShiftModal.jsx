import React from "react";
import { X, CalendarDays, Users, FileText, Pencil } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";

const Field = ({ label, icon: Icon, hint, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
      {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
      {label}
      {hint && (
        <span className="ml-auto text-xs font-normal text-slate-400 normal-case">{hint}</span>
      )}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full h-12 px-4 rounded-xl text-base text-slate-700 bg-slate-50 border border-slate-200 " +
  "hover:border-slate-300 hover:bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 focus:bg-white " +
  "transition-all duration-150 placeholder:text-slate-400";

const EditShiftModal = ({ editingShift, setEditingShift, onEditChange, onUpdateHandler }) => {
  if (!editingShift) return null;

  const startVal = editingShift.shiftStartTime?.slice(0, 16) ?? "";
  const endVal = editingShift.shiftEndTime?.slice(0, 16) ?? "";
  const handleDT = (name) => (val) => onEditChange({ target: { name, value: val } });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={() => setEditingShift(null)}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-2xl md:my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" aria-hidden />

        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 overflow-hidden shrink-0 rounded-t-2xl md:rounded-t-2xl">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Pencil size={16} className="text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white">Edit Shift</p>
                <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[240px]">{editingShift.shiftTitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingShift(null)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={onUpdateHandler} className="p-6 space-y-5 overflow-y-auto">
          <Field label="Shift Title" icon={CalendarDays}>
            <input
              name="shiftTitle"
              value={editingShift.shiftTitle}
              onChange={onEditChange}
              className={inputCls}
              required
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date & Time">
              <DateTimePicker
                value={startVal}
                onChange={handleDT("shiftStartTime")}
                placeholder="Pick start"
                accentColor="amber"
              />
            </Field>
            <Field label="End Date & Time">
              <DateTimePicker
                value={endVal}
                onChange={handleDT("shiftEndTime")}
                placeholder="Pick end"
                accentColor="amber"
              />
            </Field>
          </div>

          <Field label="Available Slots" icon={Users} hint="Max staff for this shift">
            <input
              type="number"
              inputMode="numeric"
              name="slotsAvailable"
              value={editingShift.slotsAvailable}
              onChange={onEditChange}
              min="1"
              className={inputCls}
              required
            />
          </Field>

          <Field label="Notes" icon={FileText} hint="Optional">
            <textarea
              name="shiftNotes"
              value={editingShift.shiftNotes || ""}
              onChange={onEditChange}
              rows={3}
              placeholder="Any additional details or instructions"
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-100">
            <p className="text-xs text-slate-400">
              <span className="text-red-400">*</span> Required unless noted
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setEditingShift(null)}
                className="w-full sm:w-auto px-5 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl shadow-md min-h-[48px]"
              >
                <Pencil size={13} />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditShiftModal;
