// ShiftDetails.jsx
// This is the side panel that slides in from the right side
// when a shift is clicked in the table or list.
//
// HOW IT OPENS:
// When manager clicks on a shift row in the table
// OR clicks the eye icon button on a shift,
// the selectedShift state is set in ShiftsPage.jsx.
// This component receives that shift as a prop
// and shows its details in a panel on the right.
//
// HOW IT CLOSES:
// When manager clicks the X button at the top right,
// or clicks on the dark background overlay behind the panel,
// the onClose function is called.
// This sets selectedShift back to null in ShiftsPage.jsx
// and the panel disappears with an animation.
//
// This pattern is called a "Drawer" or "Side Panel".
// It is a very common UI pattern in dashboards.
// The panel slides in from the right and overlays the content.

import React from 'react'
import {
  X,
  CalendarDays,
  Clock,
  Timer,
  Trash2,
  Pencil,
  FileText,
  UserCheck,
} from 'lucide-react'
import { getStatus } from '@/utils/shiftStatus'

// STATUS_CONFIG - colors and labels for each shift status
const STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  ongoing: {
    label: 'Ongoing',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
}

// formatDate - converts ISO string to "Jan 5, 2025" format
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

// formatTime - converts ISO string to "09:00 AM" format
const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

// getDuration - calculates shift length in "Xh Ym" format
const getDuration = (start, end) => {
  const diffMinutes = (new Date(end) - new Date(start)) / 60000
  if (diffMinutes < 60) return `${diffMinutes}m`
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

// Avatar gradient colors — assigned based on first letter of name
const GRADIENTS = [
  'from-blue-600 to-[#162d5e]',
  'from-violet-600 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
]

// getGradient - picks a gradient color based on the first character of a name
const getGradient = (name = '') =>
  GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length]

// getInitials - gets the first 2 letters of a full name in uppercase
// Example: "John Doe" → "JD", "Alice" → "AL"
const getInitials = (name = '') =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

// ShiftDetails - the sliding side panel for shift details
//
// Props:
// shift    - the shift object to show details for
//            if null, the panel is hidden
//            if has value, the panel is visible and shows this shift
// onClose  - function called when manager closes the panel
//            sets selectedShift to null in ShiftsPage.jsx
// onEdit   - function called when Edit Shift button is clicked
//            opens the edit form and closes this panel
// onDelete - function called when Delete button is clicked
//            opens delete confirmation and closes this panel
const ShiftDetails = ({ shift, onClose, onEdit, onDelete }) => {
  // If no shift is selected, don't render anything
  if (!shift) return null

  // Get the current status of this shift
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime)
  const statusStyle = STATUS_CONFIG[status]

  // Calculate how full this shift is
  const filledSlots = shift.acceptedEmployees?.length || 0
  const totalSlots = shift.slotsAvailable || 1
  const fillPercent = Math.min(
    Math.round((filledSlots / totalSlots) * 100),
    100,
  )

  // Pick fill bar color: green when full, blue when >60%, amber when low
  const fillBarColor =
    fillPercent >= 100
      ? 'bg-emerald-500'
      : fillPercent >= 60
        ? 'bg-blue-500'
        : 'bg-amber-400'

  return (
    // Dark overlay background — clicking it closes the panel
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end"
      onClick={(e) => {
        // Only close if manager clicked the overlay, not the panel itself
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* The white panel that slides in from the right */}
      <div
        className="bg-white h-full w-full sm:w-[440px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        // Stop clicks inside the panel from bubbling to the overlay
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER SECTION: gradient blue background ── */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              {/* Status badge in header */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {statusStyle.label}
              </span>

              {/* Shift title */}
              <h2 className="text-xl font-bold text-white leading-tight">
                {shift.shiftTitle}
              </h2>

              {/* Date and time range */}
              <p className="text-blue-200 text-sm mt-2">
                {formatDate(shift.shiftStartTime)}&nbsp;·&nbsp;
                {formatTime(shift.shiftStartTime)} —{' '}
                {formatTime(shift.shiftEndTime)}
              </p>
            </div>

            {/* X close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition text-white shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick action buttons inside the header */}
          <div className="flex gap-2 mt-5">
            {/* Edit button — opens the edit form and closes this panel */}
            <button
              onClick={() => {
                onEdit(shift)
                onClose()
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <Pencil size={12} /> Edit Shift
            </button>

            {/* Delete button — opens delete confirmation and closes this panel */}
            <button
              onClick={() => {
                onDelete(shift)
                onClose()
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-white text-xs font-semibold border border-red-300/20 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {/* ── SHIFT DETAILS SECTION: date, duration, start, end ── */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Shift Details
          </p>

          {/* 2x2 grid of info boxes */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date box */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={13} className="text-blue-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </p>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {formatDate(shift.shiftStartTime)}
              </p>
            </div>

            {/* Duration box */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-[#2563EB]" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Duration
                </p>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {getDuration(shift.shiftStartTime, shift.shiftEndTime)}
              </p>
            </div>

            {/* Start time box */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Timer size={13} className="text-violet-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Start
                </p>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {formatTime(shift.shiftStartTime)}
              </p>
            </div>

            {/* End time box */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Timer size={13} className="text-teal-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  End
                </p>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {formatTime(shift.shiftEndTime)}
              </p>
            </div>
          </div>
        </div>

        {/* ── CAPACITY SECTION: how many slots are filled ── */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Slot Capacity
          </p>

          {/* Number display: filled / total and percentage */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-gray-900 tabular-nums">
                {filledSlots}
              </span>
              <span className="text-gray-400 text-lg font-medium">
                /{totalSlots}
              </span>
              <span className="ml-2 text-xs text-gray-400">
                employees assigned
              </span>
            </div>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{
                color:
                  fillPercent >= 100
                    ? '#10b981'
                    : fillPercent >= 60
                      ? '#3b82f6'
                      : '#f59e0b',
              }}
            >
              {fillPercent}%
            </span>
          </div>

          {/* Fill progress bar */}
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${fillBarColor}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          {/* Remaining slots text */}
          <p className="text-xs text-gray-400 mt-2">
            {totalSlots - filledSlots} slot
            {totalSlots - filledSlots !== 1 ? 's' : ''} remaining
          </p>
        </div>

        {/* ── NOTES SECTION: only shown if shift has notes ── */}
        {shift.shiftNotes && (
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={13} className="text-gray-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Notes
              </p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
              {shift.shiftNotes}
            </p>
          </div>
        )}

        {/* ── ACCEPTED EMPLOYEES SECTION ── */}
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Accepted Employees ({filledSlots})
          </p>

          {/* Show employee list if any employees have accepted */}
          {shift.acceptedEmployees?.length > 0 ? (
            <div className="space-y-2">
              {shift.acceptedEmployees.map((employee, index) => (
                <div
                  key={employee._id || index}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Employee avatar — shows profile image or initials */}
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(employee.username || '')} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm overflow-hidden`}
                  >
                    {employee.profileImage ? (
                      <img
                        src={employee.profileImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(employee.username || '')
                    )}
                  </div>

                  {/* Employee name and email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {employee.username || '—'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {employee.email || ''}
                    </p>
                  </div>

                  {/* Position number */}
                  <span className="text-xs text-gray-300 font-medium tabular-nums shrink-0">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            // Empty state when no employees have accepted yet
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <UserCheck className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-500">
                No employees yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Employees will appear once they accept this shift.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShiftDetails
