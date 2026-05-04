import React from 'react'
import { Plus, Download, Filter } from 'lucide-react'

export default function ShiftToolbar({
  onCreateShift,
  onExport,
  shiftsCount,
  showFilters,
  onToggleFilters,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and schedule team shifts
          {typeof shiftsCount === 'number' ? (
            <span className="text-gray-400"> · {shiftsCount} total</span>
          ) : null}
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        {typeof onToggleFilters === 'function' ? (
          <button
            type="button"
            onClick={() => onToggleFilters()}
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 md:hidden"
            aria-pressed={showFilters}
            title={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        ) : null}
        {typeof onExport === 'function' ? (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCreateShift}
          className="inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 sm:w-auto sm:px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />+ Create Shift
        </button>
      </div>
    </div>
  )
}
