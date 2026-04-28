// DatePresets.jsx
// The date range filter card on the reports page.
// Shows quick preset buttons (Today, This Week, This Month, Last Month).
// Also shows custom date inputs and an Apply Filter button.
//
// HOW DRAFT VS APPLIED WORKS:
// - Draft range: what the user has typed in the date inputs
// - Applied range: the range actually used to fetch data
// - Clicking a preset immediately applies (no draft step)
// - Changing the date inputs updates draft only
// - Clicking "Apply filter" copies draft into applied and triggers a fetch

import React from "react";

// DatePresets - full date range filter card
//
// Props:
// draftRange   - { start, end } strings in YYYY-MM-DD format
//                what is currently shown in the date inputs
// activePreset - which preset is currently active
//                "today" | "thisWeek" | "thisMonth" | "lastMonth" | "custom"
// onPresetClick  - function called when a preset button is clicked
//                  receives the preset key string
// onDraftChange  - function called when user changes a date input
//                  receives { start, end } with updated value
// onApply        - function called when Apply Filter is clicked
//                  triggers a data fetch with the current draft range
const DatePresets = ({
  draftRange,
  activePreset,
  onPresetClick,
  onDraftChange,
  onApply,
}) => {
  // presets - list of quick date range buttons to render
  const presets = [
    { key: "today",     label: "Today" },
    { key: "thisWeek",  label: "This Week" },
    { key: "thisMonth", label: "This Month" },
    { key: "lastMonth", label: "Last Month" },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm font-semibold text-gray-800">Date range</p>
      <p className="text-xs text-gray-400">Filter metrics to shifts starting in this period</p>

      {/* Quick preset buttons */}
      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1 md:mx-0">
        {presets.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onPresetClick(key)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 ${
              activePreset === key
                ? "bg-[#1B3F8B] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date inputs + Apply button */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          {/* From date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="rep-from">
              From
            </label>
            <input
              id="rep-from"
              type="date"
              value={draftRange.start}
              onChange={(e) =>
                onDraftChange({ ...draftRange, start: e.target.value })
              }
              className="h-12 w-full rounded-xl border border-gray-200 px-3 text-base text-gray-900 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 md:text-sm"
            />
          </div>

          {/* To date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="rep-to">
              To
            </label>
            <input
              id="rep-to"
              type="date"
              value={draftRange.end}
              onChange={(e) =>
                onDraftChange({ ...draftRange, end: e.target.value })
              }
              className="h-12 w-full rounded-xl border border-gray-200 px-3 text-base text-gray-900 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 md:text-sm"
            />
          </div>
        </div>

        {/* Apply filter button */}
        <button
          type="button"
          onClick={onApply}
          className="h-12 min-h-[44px] w-full shrink-0 rounded-xl bg-[#1B3F8B] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#162d5e] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          Apply filter
        </button>
      </div>
    </div>
  );
};

export default DatePresets;
