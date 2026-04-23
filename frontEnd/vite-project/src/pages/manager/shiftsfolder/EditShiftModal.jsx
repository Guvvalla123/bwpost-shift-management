import React, { useState, useEffect } from "react";
import { CalendarDays, Users, FileText, Pencil } from "lucide-react";
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
  "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 " +
  "hover:border-gray-300";

const nativeDatetimeCls =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900 md:text-sm " +
  "transition-colors duration-150 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

const toDatetimeLocalValue = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const EditShiftModal = ({ editingShift, setEditingShift, onEditChange, onUpdateHandler, submitting = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const q = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    q();
    window.addEventListener("resize", q);
    return () => window.removeEventListener("resize", q);
  }, []);

  if (!editingShift) return null;

  const startLocal = toDatetimeLocalValue(editingShift.shiftStartTime);
  const endLocal = toDatetimeLocalValue(editingShift.shiftEndTime);
  const handleDT = (name) => (val) => onEditChange({ target: { name, value: val } });

  const isEndBeforeStart =
    endLocal &&
    startLocal &&
    new Date(endLocal) <= new Date(startLocal);

  const handleMobileStartChange = (e) => {
    const v = e.target.value;
    onEditChange({ target: { name: "shiftStartTime", value: v } });
    if (editingShift.shiftEndTime && v && new Date(editingShift.shiftEndTime) <= new Date(v)) {
      onEditChange({ target: { name: "shiftEndTime", value: "" } });
    }
  };

  return (
    <Modal
      isOpen={!!editingShift}
      onClose={() => {
        if (!submitting) setEditingShift(null);
      }}
      title="Edit Shift"
      description={editingShift.shiftTitle}
      size="lg"
      bodyClassName="!pt-2"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditingShift(null)}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-shift-form"
            variant="primary"
            loading={submitting}
            loadingText="Saving"
            className="w-full !bg-amber-500 !text-white hover:!bg-amber-600 active:!bg-amber-700 md:w-auto"
            leftIcon={submitting ? undefined : Pencil}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-shift-form" onSubmit={onUpdateHandler} className="space-y-5" aria-busy={submitting}>
        <Input
          id="edit-shift-title"
          name="shiftTitle"
          label="Shift Title"
          leftIcon={CalendarDays}
          value={editingShift.shiftTitle}
          onChange={onEditChange}
          required
          autoFocus
        />

        {isMobile ? (
          <div className="space-y-4">
            <div className="w-full">
              <label htmlFor="edit-shift-start-m" className="mb-2 block text-sm font-medium text-gray-700">
                Start Date and Time
              </label>
              <input
                id="edit-shift-start-m"
                type="datetime-local"
                value={startLocal}
                onChange={handleMobileStartChange}
                className={nativeDatetimeCls}
              />
            </div>
            <div className="w-full">
              <label htmlFor="edit-shift-end-m" className="mb-2 block text-sm font-medium text-gray-700">
                End Date and Time
              </label>
              <input
                id="edit-shift-end-m"
                type="datetime-local"
                value={endLocal}
                onChange={(e) => onEditChange({ target: { name: "shiftEndTime", value: e.target.value } })}
                min={startLocal || undefined}
                disabled={!editingShift.shiftStartTime}
                className={cn(
                  nativeDatetimeCls,
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isEndBeforeStart && "ring-2 ring-red-500/40"
                )}
              />
              {!editingShift.shiftStartTime && (
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
                value={startLocal}
                onChange={handleDT("shiftStartTime")}
                placeholder="Pick start"
                accentColor="amber"
              />
            </Field>
            <Field label="End Date & Time">
              <div className={cn("rounded-xl", isEndBeforeStart && "ring-2 ring-red-500/40")}>
                <DateTimePicker
                  value={endLocal}
                  onChange={handleDT("shiftEndTime")}
                  placeholder="Pick end"
                  accentColor="amber"
                />
              </div>
              {isEndBeforeStart && (
                <p className="mt-1 text-xs text-red-500">End time must be after start time</p>
              )}
            </Field>
          </div>
        )}

        <Input
          id="edit-shift-slots"
          name="slotsAvailable"
          type="number"
          inputMode="numeric"
          label="Available Slots"
          leftIcon={Users}
          hint="Max staff for this shift"
          value={editingShift.slotsAvailable}
          onChange={onEditChange}
          min={1}
          required
        />

        <div className="space-y-1.5">
          <Field label="Notes" icon={FileText} hint="Optional" />
          <textarea
            name="shiftNotes"
            value={editingShift.shiftNotes || ""}
            onChange={onEditChange}
            rows={3}
            placeholder="Any additional details or instructions"
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

export default EditShiftModal;
