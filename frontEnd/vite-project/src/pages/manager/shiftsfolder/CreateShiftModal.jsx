import React, { useState, useEffect } from "react";
import { CalendarDays, Users, FileText } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const Field = ({ label, icon: Icon, hint, children }) => (
  <div className="space-y-1.5">
    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
      {Icon && <Icon size={14} className="shrink-0 text-gray-400" />}
      {label}
      {hint && (
        <span className="ml-auto text-xs font-normal normal-case text-gray-400">{hint}</span>
      )}
    </span>
    {children}
  </div>
);

const textareaCls =
  "min-h-[5rem] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 md:text-sm " +
  "transition-colors duration-150 placeholder:text-gray-400 " +
  "focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 " +
  "hover:border-gray-300";

const nativeDatetimeCls =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900 md:text-sm " +
  "transition-colors duration-150 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20";

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
    <Modal
      isOpen={show}
      onClose={() => {
        if (!submitting) setShow(false);
      }}
      title="Create New Shift"
      description="Schedule a shift for your team"
      size="lg"
      bodyClassName="!pt-2"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShow(false)}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-shift-form"
            variant="primary"
            loading={submitting}
            loadingText="Creating"
            className="w-full md:w-auto"
            leftIcon={submitting ? undefined : CalendarDays}
          >
            Create Shift
          </Button>
        </>
      }
    >
      <form id="create-shift-form" onSubmit={onSubmit} className="space-y-5" aria-busy={submitting}>
        <Input
          id="create-shift-title"
          name="shiftTitle"
          label="Shift Title"
          leftIcon={CalendarDays}
          placeholder="e.g. Morning Shift, Night Cover, Weekend Shift"
          value={createShift.shiftTitle}
          onChange={onChange}
          required
          autoFocus
        />

        {isMobile ? (
          <div className="space-y-4">
            <div className="w-full">
              <label htmlFor="create-shift-start-m" className="mb-2 block text-sm font-medium text-gray-700">
                Start Date and Time
              </label>
              <input
                id="create-shift-start-m"
                type="datetime-local"
                value={startVal}
                onChange={handleMobileStartChange}
                min={minNowLocal()}
                className={nativeDatetimeCls}
              />
            </div>
            <div className="w-full">
              <label htmlFor="create-shift-end-m" className="mb-2 block text-sm font-medium text-gray-700">
                End Date and Time
              </label>
              <input
                id="create-shift-end-m"
                type="datetime-local"
                value={endVal}
                onChange={(e) => onChange({ target: { name: "shiftEndTime", value: e.target.value } })}
                min={startVal || minNowLocal()}
                disabled={!createShift.shiftStartTime}
                className={cn(
                  nativeDatetimeCls,
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isEndBeforeStart && "ring-2 ring-red-500/40"
                )}
              />
              {!createShift.shiftStartTime && (
                <p className="mt-1 px-1 text-xs text-gray-400">Select start time first</p>
              )}
              {isEndBeforeStart && (
                <p className="mt-1 text-xs text-red-500">End time must be after start time</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start Date & Time">
              <DateTimePicker
                value={createShift.shiftStartTime}
                onChange={handleDT("shiftStartTime")}
                placeholder="Pick start"
                accentColor="blue"
              />
            </Field>
            <Field label="End Date & Time">
              <div className={cn("rounded-xl", isEndBeforeStart && "ring-2 ring-red-500/40")}>
                <DateTimePicker
                  value={createShift.shiftEndTime}
                  onChange={handleDT("shiftEndTime")}
                  placeholder="Pick end"
                  accentColor="blue"
                />
              </div>
              {isEndBeforeStart && (
                <p className="mt-1 text-xs text-red-500">End time must be after start time</p>
              )}
            </Field>
          </div>
        )}

        <Input
          id="create-shift-slots"
          name="slotsAvailable"
          type="number"
          inputMode="numeric"
          label="Available Slots"
          leftIcon={Users}
          hint="Max staff for this shift"
          placeholder="e.g. 5"
          value={createShift.slotsAvailable}
          onChange={onChange}
          min={1}
          required
        />

        <div className="space-y-1.5">
          <Field label="Notes" icon={FileText} hint="Optional" />
          <textarea
            name="shiftNotes"
            placeholder="Any additional details or instructions"
            value={createShift.shiftNotes}
            onChange={onChange}
            rows={3}
            className={textareaCls}
          />
        </div>

        <p className="text-xs text-gray-400">
          <span className="text-red-400">*</span> Required unless noted
        </p>
      </form>
    </Modal>
  );
};

export default CreateShiftModal;
