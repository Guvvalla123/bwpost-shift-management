import React, { useState, useEffect } from "react";
import { X, CalendarDays, Users, FileText, Sparkles, Loader2 } from "lucide-react";
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
  "focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B] focus:bg-white " +
  "transition-all duration-150 placeholder:text-slate-400";

const nativeDatetimeCls =
  "w-full h-12 px-4 text-base border border-gray-300 rounded-xl bg-white text-gray-900 " +
  "focus:outline-none focus:ring-2 focus:ring-[#1B3F8B] focus:border-transparent";

const toDatetimeLocalValue = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const minNowLocal = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const CreateShiftModal = ({ show, setShow, createShift, onChange, onSubmit, submitting = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const q = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    q();
    window.addEventListener("resize", q);
    return () => window.removeEventListener("resize", q);
  }, []);

  if (!show) return null;

  const handleDT = (name) => (val) => onChange({ target: { name, value: val } });

  const startVal = toDatetimeLocalValue(createShift.shiftStartTime);
  const endVal = toDatetimeLocalValue(createShift.shiftEndTime);

  const isEndBeforeStart =
    createShift.shiftEndTime &&
    createShift.shiftStartTime &&
    new Date(createShift.shiftEndTime) <= new Date(createShift.shiftStartTime);

  const handleMobileStartChange = (e) => {
    const v = e.target.value;
    onChange({ target: { name: "shiftStartTime", value: v } });
    if (createShift.shiftEndTime && v && new Date(createShift.shiftEndTime) <= new Date(v)) {
      onChange({ target: { name: "shiftEndTime", value: "" } });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShow(false);
      }}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-t-2xl md:rounded-2xl shadow-2xl md:my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" aria-hidden />

        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 overflow-hidden shrink-0 rounded-t-2xl md:rounded-t-2xl">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#2563EB]/10 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 border border-[#93C5FD]/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-[#93C5FD]" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white">Create New Shift</p>
                <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">Schedule a shift for your team</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto" aria-busy={submitting}>
          <Field label="Shift Title" icon={CalendarDays}>
            <input
              name="shiftTitle"
              placeholder="e.g. Morning Shift, Night Cover, Weekend Shift"
              value={createShift.shiftTitle}
              onChange={onChange}
              className={inputCls}
              required
              autoFocus
            />
          </Field>

          {isMobile ? (
            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date and Time</label>
                <input
                  type="datetime-local"
                  value={startVal}
                  onChange={handleMobileStartChange}
                  min={minNowLocal()}
                  className={nativeDatetimeCls}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date and Time</label>
                <input
                  type="datetime-local"
                  value={endVal}
                  onChange={(e) => onChange({ target: { name: "shiftEndTime", value: e.target.value } })}
                  min={startVal || minNowLocal()}
                  disabled={!createShift.shiftStartTime}
                  className={`${nativeDatetimeCls} disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEndBeforeStart ? "ring-2 ring-red-500/40 rounded-xl" : ""
                  }`}
                />
                {!createShift.shiftStartTime && (
                  <p className="text-xs text-gray-400 mt-1 px-1">Select start time first</p>
                )}
                {isEndBeforeStart && (
                  <p className="text-xs text-red-500 mt-1">End time must be after start time</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start Date & Time">
                <DateTimePicker
                  value={createShift.shiftStartTime}
                  onChange={handleDT("shiftStartTime")}
                  placeholder="Pick start"
                  accentColor="blue"
                />
              </Field>
              <Field label="End Date & Time">
                <div className={`rounded-xl ${isEndBeforeStart ? "ring-2 ring-red-500/40" : ""}`}>
                  <DateTimePicker
                    value={createShift.shiftEndTime}
                    onChange={handleDT("shiftEndTime")}
                    placeholder="Pick end"
                    accentColor="blue"
                  />
                </div>
                {isEndBeforeStart && (
                  <p className="text-xs text-red-500 mt-1">End time must be after start time</p>
                )}
              </Field>
            </div>
          )}

          <Field label="Available Slots" icon={Users} hint="Max staff for this shift">
            <input
              type="number"
              inputMode="numeric"
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
              placeholder="Any additional details or instructions"
              value={createShift.shiftNotes}
              onChange={onChange}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="border-t border-slate-100" />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-100">
            <p className="text-xs text-slate-400 text-center sm:text-left order-1 sm:order-none">
              <span className="text-red-400">*</span> Required unless noted
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShow(false)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition min-h-[48px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1B3F8B] to-blue-600 text-white text-sm font-semibold rounded-xl shadow-md min-h-[48px] disabled:pointer-events-none disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  <>
                    <CalendarDays size={14} />
                    Create Shift
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShiftModal;
