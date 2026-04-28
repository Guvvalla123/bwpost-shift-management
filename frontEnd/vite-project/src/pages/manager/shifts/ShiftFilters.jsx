// ShiftFilters.jsx
// Shows the search bar and filter tabs at the top of the shifts list.
// Manager can search shifts by title or filter by status.
//
// HOW IT WORKS:
// The filter tabs (All / Upcoming / Ongoing / Completed) update activeFilter.
// The search box updates searchText.
// Both are passed up to ShiftsPage.jsx which reloads the shift list.

import React from "react";
import { Search, X } from "lucide-react";

// ShiftFilters - toolbar with filter tabs and search box
//
// Props:
// searchText     - the text currently typed in the search box
// onSearchChange - function called when user types in the search box
//                  receives the new text string as argument
// activeFilter   - which filter tab is currently selected
//                  can be: "all", "upcoming", "ongoing", "completed"
// onFilterChange - function called when user clicks a filter tab
//                  receives the filter name string as argument
// statusCounts   - object with count for each filter tab
//                  example: { all: 10, upcoming: 3, ongoing: 2, completed: 5 }
const ShiftFilters = ({
  searchText,
  onSearchChange,
  activeFilter,
  onFilterChange,
  statusCounts,
}) => {
  // Define all filter tabs in one place
  // key   - the value sent to onFilterChange when clicked
  // label - the text shown on the tab button
  const FILTER_TABS = [
    { key: "all",       label: "All" },
    { key: "upcoming",  label: "Upcoming" },
    { key: "ongoing",   label: "Ongoing" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

      {/* Filter tab buttons */}
      <div className="inline-flex w-full flex-wrap gap-1 rounded-full bg-slate-100/80 p-1 sm:w-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onFilterChange(tab.key)}
            className={`min-h-[40px] flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-all sm:flex-none sm:px-4 ${
              activeFilter === tab.key
                ? "bg-white text-[#1B3F8B] shadow-sm ring-1 ring-gray-200/80"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}{" "}
            {/* Show the count in brackets next to the label */}
            <span className="tabular-nums text-gray-400">
              ({statusCounts[tab.key] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Search box */}
      <div className="relative w-full sm:w-72 sm:shrink-0">
        {/* Search icon on the left side of the input */}
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          type="search"
          placeholder="Search shifts..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 md:text-sm"
          aria-label="Search shifts"
        />

        {/* Show X button to clear search when there is text */}
        {searchText.trim() ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ShiftFilters;
