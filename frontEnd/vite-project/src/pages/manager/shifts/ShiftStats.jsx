// ShiftStats.jsx
// Shows the 4 stat cards at the top of the shifts page.
// Cards show: Total Shifts, Ongoing, Upcoming, Completed.
// Clicking a card filters the shift list to that status.
//
// HOW IT WORKS:
// The parent (ShiftsPage.jsx) passes in the count numbers.
// When manager clicks a card, onFilterClick is called
// with the filter name, and the parent updates the list.

import { CalendarDays, CheckCircle2, Timer, CalendarX } from 'lucide-react'
import { SkeletonKpi } from '@/components/ui'

// StatCard - one clickable stat card
// label   - the text label shown under the number
// value   - the count number to show
// icon    - the lucide icon component to show
// active  - true when this card's filter is currently selected
//           makes the card highlighted in blue
// onClick - function called when manager clicks this card
const StatCard = ({ label, value, icon: Icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full flex-col rounded-2xl border p-4 text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 ${
      active
        ? 'border-[#1B3F8B] bg-[#EFF6FF] ring-1 ring-[#1B3F8B]/20'
        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
    }`}
  >
    <div className="flex items-center gap-3">
      {/* Icon box — blue when active, light blue when inactive */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? 'bg-[#1B3F8B] text-white' : 'bg-blue-50 text-[#1B3F8B]'
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>

      {/* Label and number */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      </div>
    </div>
  </button>
)

// ShiftStats - the row of 4 stat cards
//
// Props:
// statusCounts  - object with counts for each filter:
//                 { all: 0, ongoing: 0, upcoming: 0, completed: 0 }
// activeFilter  - the currently selected filter name ("all", "ongoing" etc)
//                 the matching card will be highlighted
// onFilterClick - function called when a card is clicked
//                 receives the filter name string as argument
//                 example: onFilterClick("ongoing")
// loading       - true while the data is loading
//                 shows skeleton placeholders instead of cards
const ShiftStats = ({ statusCounts, activeFilter, onFilterClick, loading }) => {
  // Show skeleton loading cards while data is being fetched
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {/* Total Shifts card — clicking shows all shifts */}
      <StatCard
        label="Total Shifts"
        value={statusCounts.all}
        icon={CalendarDays}
        active={activeFilter === 'all'}
        onClick={() => onFilterClick('all')}
      />

      {/* Ongoing card — clicking shows only ongoing shifts */}
      <StatCard
        label="Ongoing"
        value={statusCounts.ongoing}
        icon={CheckCircle2}
        active={activeFilter === 'ongoing'}
        onClick={() => onFilterClick('ongoing')}
      />

      {/* Upcoming card — clicking shows only upcoming shifts */}
      <StatCard
        label="Upcoming"
        value={statusCounts.upcoming}
        icon={Timer}
        active={activeFilter === 'upcoming'}
        onClick={() => onFilterClick('upcoming')}
      />

      {/* Completed card — clicking shows only completed shifts */}
      <StatCard
        label="Completed"
        value={statusCounts.completed}
        icon={CalendarX}
        active={activeFilter === 'completed'}
        onClick={() => onFilterClick('completed')}
      />
    </div>
  )
}

export default ShiftStats
