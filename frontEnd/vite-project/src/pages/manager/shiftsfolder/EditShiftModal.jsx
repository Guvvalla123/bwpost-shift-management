import React from "react";
import { X, CalendarDays, Users, FileText, Pencil } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";

const Field = ({ label, icon: Icon, hint, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {Icon && <Icon size={12} className="text-slate-400" />}
      {label}
      {hint && (
        <span className="ml-auto text-[10px] font-normal text-slate-400 normal-case tracking-normal">{hint}</span>
      )}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-4 py-2.5 rounded-xl text-sm text-slate-700 bg-slate-50 border border-slate-200 " +
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setEditingShift(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Pencil size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Edit Shift</p>
                <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[240px]">{editingShift.shiftTitle}</p>
              </div>
            </div>
            <button onClick={() => setEditingShift(null)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onUpdateHandler} className="p-6 space-y-5">
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

          <div className="grid grid-cols-2 gap-4">
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
              placeholder="Any additional details or instructions…"
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="border-t border-slate-100" />

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400"><span className="text-red-400">*</span> Required unless noted</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingShift(null)}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-amber-500/30 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200">
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
