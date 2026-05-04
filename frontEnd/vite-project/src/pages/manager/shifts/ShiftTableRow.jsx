// ShiftTableRow.jsx
// Shows ONE shift as a row in the desktop table.
// Only visible on medium screens and above (md:).
// Mobile uses ShiftCard.jsx instead.
//
// Clicking anywhere on the row opens the details panel (same as eye button).
// The eye, edit, and delete buttons are on the right side of the row.

import React from 'react'
import {
  CalendarDays,
  Clock,
  AlignLeft,
  Timer,
  CheckCircle2,
  CalendarX,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import { getStatus } from '@/utils/shiftStatus'

// STATUS_CONFIG - defines colors and icons for each shift status
const STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    icon: Timer,
  },
  ongoing: {
    label: 'Ongoing',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    icon: CalendarX,
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

// getDuration - calculates how long a shift is in "Xh Ym" format
// Returns "45m" for short shifts, "2h 30m" or "3h" for longer ones
const getDuration = (start, end) => {
  const diffMinutes = (new Date(end) - new Date(start)) / 60000
  if (diffMinutes < 60) return `${diffMinutes}m`
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

// ShiftTableRow - one shift row for the desktop table
//
// Props:
// shift    - the shift object to display
// onView   - function called when row or eye button is clicked
//            opens the shift details side panel
// onEdit   - function called when pencil button is clicked
//            opens the edit shift form
// onDelete - function called when trash button is clicked
//            opens the delete confirmation dialog
const ShiftTableRow = ({ shift, onView, onEdit, onDelete }) => {
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

  return (
    <tr
      // Clicking the row opens the details panel (same as eye button)
      onClick={() => onView(shift)}
      className="group cursor-pointer border-b border-slate-50 transition-colors duration-150 even:bg-slate-50/40 hover:bg-blue-50/50"
    >
      {/* COLUMN 1: Shift title and optional notes */}
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          {/* Blue calendar icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-[#162d5e] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            {/* Shift title — turns blue on row hover */}
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {shift.shiftTitle}
            </p>
            {/* Show notes preview if notes exist */}
            {shift.shiftNotes && (
              <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5 flex items-center gap-1">
                <AlignLeft className="w-3 h-3 shrink-0" />
                {shift.shiftNotes}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* COLUMN 2: Date and time range */}
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm font-medium text-gray-800">
          {formatDate(shift.shiftStartTime)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(shift.shiftStartTime)} → {formatTime(shift.shiftEndTime)}
          {/* Duration pill */}
          <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-gray-500 font-medium text-[10px]">
            {getDuration(shift.shiftStartTime, shift.shiftEndTime)}
          </span>
        </p>
      </td>

      {/* COLUMN 3: Status badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
        >
          {/* Pulsing animated dot for ongoing, static dot for others */}
          {status === 'ongoing' ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${statusStyle.dot}`}
              />
            </span>
          ) : (
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
          )}
          {statusStyle.label}
        </span>
      </td>

      {/* COLUMN 4: Fill rate progress bar */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${
                fillPercent >= 100
                  ? 'bg-emerald-500'
                  : fillPercent >= 60
                    ? 'bg-blue-500'
                    : 'bg-amber-400'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 tabular-nums">
            {filledSlots}/{totalSlots}
          </span>
        </div>
      </td>

      {/* COLUMN 5: Action buttons (eye, edit, delete) */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-end gap-0.5">
          {/* Eye button — view details (also triggered by clicking the row) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onView(shift)
            }}
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1B3F8B]"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Pencil button — edit this shift */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(shift)
            }}
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#1B3F8B]"
            title="Edit shift"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {/* Trash button — delete this shift */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(shift)
            }}
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
            title="Delete shift"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Chevron arrow — visual hint that the row is clickable */}
          <ChevronRight
            className="ml-0.5 h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500"
            aria-hidden
          />
        </div>
      </td>
    </tr>
  )
}

export default ShiftTableRow
