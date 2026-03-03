import React from "react";
import { X, CalendarDays, Users, FileText, Sparkles } from "lucide-react";
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
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:bg-white " +
  "transition-all duration-150 placeholder:text-slate-400";

const CreateShiftModal = ({ show, setShow, createShift, onChange, onSubmit }) => {
  if (!show) return null;

  const handleDT = (name) => (val) => onChange({ target: { name, value: val } });

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Create New Shift</p>
                <p className="text-slate-400 text-xs mt-0.5">Schedule a shift for your team</p>
              </div>
            </div>
            <button onClick={() => setShow(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <Field label="Shift Title" icon={CalendarDays}>
            <input
              name="shiftTitle"
              placeholder="e.g. Morning Shift, Night Cover, Weekend Shift…"
              value={createShift.shiftTitle}
              onChange={onChange}
              className={inputCls}
              required
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date & Time">
              <DateTimePicker
                value={createShift.shiftStartTime}
                onChange={handleDT("shiftStartTime")}
                placeholder="Pick start"
                accentColor="blue"
              />
            </Field>
            <Field label="End Date & Time">
              <DateTimePicker
                value={createShift.shiftEndTime}
                onChange={handleDT("shiftEndTime")}
                placeholder="Pick end"
                accentColor="blue"
              />
            </Field>
          </div>

          <Field label="Available Slots" icon={Users} hint="Max staff for this shift">
            <input
              type="number"
              name="slotsAvailable"
              placeholder="e.g. 5"
              value={createShift.slotsAvailable}
              onChange={onChange}
              min="1"
              className={inputCls}
              required
            />
          </Field>

          <Field label="Notes" icon={FileText} hint="Optional">
            <textarea
              name="shiftNotes"
              placeholder="Any additional details or instructions…"
              value={createShift.shiftNotes}
              onChange={onChange}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="border-t border-slate-100" />

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400"><span className="text-red-400">*</span> Required unless noted</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShow(false)}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/30 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200">
                <CalendarDays size={14} />
                Create Shift
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShiftModal;
