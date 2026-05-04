import { Search, X } from 'lucide-react'

export default function EmployeeFilters({
  search,
  onSearchChange,
  onReset,
  roleFilter,
  onRoleFilterChange,
  pillCounts,
}) {
  const activeFilters = (search.trim() ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0)

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'All', count: pillCounts.all },
          { key: 'manager', label: 'Manager', count: pillCounts.manager },
          { key: 'employee', label: 'Employee', count: pillCounts.employee },
        ].map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => onRoleFilterChange(pill.key)}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              roleFilter === pill.key
                ? 'bg-[#1B3F8B] text-white shadow-sm'
                : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {pill.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                roleFilter === pill.key
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-gray-500'
              }`}
            >
              {pill.count}
            </span>
          </button>
        ))}
        {activeFilters > 0 ? (
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset filters
              <span className="rounded-full bg-[#1B3F8B]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B3F8B]">
                {activeFilters}
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative w-full sm:ml-auto sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
          aria-label="Search employees"
        />
        {search.trim() ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
