import React from "react";
import { X, CalendarDays } from "lucide-react";

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm";
const labelCls = "block text-sm font-medium text-gray-700 mb-2";

const Field = ({ label, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

const CreateShiftModal = ({ show, setShow, createShift, onChange, onSubmit }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Create New Shift</h2>
          </div>
          <button
            onClick={() => setShow(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <Field label="Shift Title">
            <input
              name="shiftTitle"
              placeholder="e.g. Morning Shift, Night Shift"
              value={createShift.shiftTitle}
              onChange={onChange}
              className={inputCls}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Time">
              <input
                type="datetime-local"
                name="shiftStartTime"
                value={createShift.shiftStartTime}
                onChange={onChange}
                className={inputCls}
                required
              />
            </Field>
            <Field label="End Time">
              <input
                type="datetime-local"
                name="shiftEndTime"
                value={createShift.shiftEndTime}
                onChange={onChange}
                className={inputCls}
                required
              />
            </Field>
          </div>

          <Field label="Available Slots">
            <input
              type="number"
              name="slotsAvailable"
              placeholder="Number of staff needed"
              value={createShift.slotsAvailable}
              onChange={onChange}
              min="1"
              className={inputCls}
              required
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              name="shiftNotes"
              placeholder="Any additional details or instructions..."
              value={createShift.shiftNotes}
              onChange={onChange}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-sm"
            >
              Create Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShiftModal;
