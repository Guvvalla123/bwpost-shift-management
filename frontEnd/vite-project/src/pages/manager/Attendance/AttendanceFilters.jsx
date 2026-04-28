// AttendanceFilters.jsx
// Shows the shift selector dropdown and search bar
// at the top of the attendance page.
// Manager selects a shift to see its attendance records.
// Manager can also search employees and export CSV.
//
// Contains the custom ShiftSelect dropdown component
// which shows shift title, date, and time in each option.

import React, { useState } from "react";
import { CalendarDays, ChevronDown, Search, Download, X } from "lucide-react";
import { formatDate, formatTime } from "./attendanceApi";

// ─── ShiftSelect ────────────────────────────────────────────
// Custom dropdown component for selecting a shift.
// Shows shift title, date, and time for each option.
// Clicking outside the dropdown closes it.
//
// shifts   - array of shift objects to show in the dropdown
// value    - the _id of the currently selected shift
// onChange - function called when a shift is selected
//            receives the shift._id string as argument
const ShiftSelect = ({ shifts, value, onChange }) => {
  // Track whether the dropdown is open or closed
  const [isOpen, setIsOpen] = useState(false);

  // Find the currently selected shift object (for display)
  const selectedShift = shifts.find((s) => s._id === value);

  return (
    <div className="relative">
      {/* The trigger button that shows current selection */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 transition-all shadow-sm"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          {selectedShift ? (
            <span className="truncate">
              <span className="font-semibold text-gray-800">{selectedShift.shiftTitle}</span>
              <span className="text-gray-400 ml-2">
                {formatDate(selectedShift.shiftStartTime)} · {formatTime(selectedShift.shiftStartTime)}
              </span>
            </span>
          ) : (
            <span className="text-gray-400">Select a shift…</span>
          )}
        </span>
        {/* Arrow icon rotates when dropdown is open */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown list — shown only when isOpen is true */}
      {isOpen && (
        <>
          {/* Invisible overlay to close dropdown when clicking outside */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* The dropdown list of shifts */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-72 overflow-auto">
            {shifts.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400 text-center">No shifts found</p>
            ) : (
              shifts.map((shift) => (
                <button
                  key={shift._id}
                  onClick={() => { onChange(shift._id); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#EFF6FF] transition-colors border-b border-slate-50 last:border-0 ${
                    value === shift._id ? "bg-[#EFF6FF]" : ""
                  }`}
                >
                  {/* Blue calendar icon */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarDays className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    {/* Shift title — blue when selected */}
                    <p className={`text-sm font-semibold truncate ${value === shift._id ? "text-[#1B3F8B]" : "text-gray-800"}`}>
                      {shift.shiftTitle}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(shift.shiftStartTime)} · {formatTime(shift.shiftStartTime)} — {formatTime(shift.shiftEndTime)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// AttendanceFilters - the top filter bar on the attendance page
//
// Props:
// shifts         - array of all shifts to show in the dropdown
// selectedShiftId - the _id of the currently selected shift
//                  empty string means no shift selected yet
// onShiftChange  - function called when manager picks a shift
//                  receives the shift._id string as argument
// searchText     - the text currently typed in the employee search box
// onSearchChange - function called when manager types in the search box
//                  receives the new text string as argument
// onExportCSV    - function called when Export CSV button is clicked
//                  triggers CSV download in AttendancePage.jsx
const AttendanceFilters = ({
  shifts,
  selectedShiftId,
  onShiftChange,
  searchText,
  onSearchChange,
  onExportCSV,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
        Select Shift
      </p>

      {/* ── Row 1: Shift dropdown + Export button ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Shift selector — takes up all available space */}
        <div className="flex-1">
          <ShiftSelect
            shifts={shifts}
            value={selectedShiftId}
            onChange={onShiftChange}
          />
        </div>

        {/* Export CSV button — only shown when a shift is selected */}
        {selectedShiftId && (
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 shrink-0"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* ── Row 2: Employee search box ── */}
      {/* Only shown when a shift is selected and has records to search */}
      {selectedShiftId && (
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search employees…"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
            aria-label="Search employees"
          />
          {/* X button to clear search */}
          {searchText.trim() ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AttendanceFilters;
