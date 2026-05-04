// EmployeeCard.jsx
// Shows ONE employee as a card on mobile screens.
// Displays avatar with initials, name, email, role badge,
// active status, weekly hours progress bar, and action buttons.
// Manager can view attendance, edit, delete, or reset password.

import React from 'react'
import { Eye, Pencil, Trash2, Key } from 'lucide-react'
import { Badge } from '@/components/ui'

// AVATAR_GRADIENTS - list of gradient classes for avatar background
// Each employee gets a consistent color based on their username's first letter.
const AVATAR_GRADIENTS = [
  'from-blue-600 to-[#162d5e]',
  'from-violet-600 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
]

// getAvatarGradient - picks a gradient based on the first letter of the name
// name - the employee's username string
// Returns one of the gradient CSS class strings above
function getAvatarGradient(name = '') {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length]
}

// getInitials - gets 1-2 uppercase letters to show inside the avatar circle
// name - the employee's full username
// Returns a string like "JD" or "A"
function getInitials(name = '') {
  return (
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
}

// formatDate - converts a date string to a short readable format
// iso - ISO date string from the server (e.g. "2024-03-15T...")
// Returns a string like "Mar 15, 2024" or "—" if no date
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// EmployeeCard - displays one employee as a mobile-friendly card
//
// Props:
// employee          - the employee object to display
//                     must have: _id, username, email, isActive, role, createdAt
// onEdit            - function called when the edit (pencil) button is clicked
//                     opens the EditEmployeeModal with this employee
// onDelete          - function called when the delete (trash) button is clicked
//                     opens the DeleteEmployeeModal for this employee
// onResetPassword   - function called when the key button is clicked
//                     opens the ResetPasswordModal for this employee
// onViewAttendance  - function called when the eye button is clicked
//                     opens the attendance history drawer for this employee
const EmployeeCard = ({
  employee,
  onEdit,
  onDelete,
  onResetPassword,
  onViewAttendance,
}) => {
  // Determine if employee is active or inactive
  const isActive = employee.isActive !== false

  // Determine if this employee is a manager or regular employee
  const isManager = employee.role === 'manager'

  // Weekly hours data for the progress bar
  const weeklyHours = employee.weeklyHours ?? 0
  const hoursPct = Math.min(Math.round((weeklyHours / 40) * 100), 100)

  // Bar color changes based on how many hours they have worked this week
  const hoursBarColor =
    weeklyHours >= 40
      ? 'bg-red-400'
      : weeklyHours >= 30
        ? 'bg-amber-400'
        : 'bg-green-500'

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      {/* TOP ROW: avatar + name and email + active/inactive badge */}
      <div className="mb-3 flex items-center gap-3">
        {/* Colored avatar circle with initials */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(employee.username)} text-sm font-semibold text-white`}
        >
          {getInitials(employee.username)}
        </div>

        {/* Name and email */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-gray-900 truncate">
            {employee.username}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {employee.email}
          </p>
        </div>

        {/* Active or Inactive status badge */}
        <Badge variant={isActive ? 'success' : 'gray'} className="shrink-0">
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* MIDDLE ROW: role badge + join date */}
      <div className="mb-3 flex items-center justify-between">
        {/* Manager or Employee role badge */}
        <Badge variant={isManager ? 'navy' : 'info'}>
          {isManager ? 'Manager' : 'Employee'}
        </Badge>
        {/* When they joined the company */}
        <span className="text-xs text-gray-400">
          Joined {formatDate(employee.createdAt)}
        </span>
      </div>

      {/* WEEKLY HOURS ROW: progress bar showing hours worked vs 40hr target */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>This week</span>
          <span className="tabular-nums font-medium">
            {weeklyHours} of 40 hrs
          </span>
        </div>
        {/* Progress bar — color changes based on hours */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${hoursBarColor}`}
            style={{ width: `${hoursPct}%` }}
          />
        </div>
      </div>

      {/* BOTTOM ROW: action icon buttons */}
      <div className="flex items-center justify-end gap-0.5 border-t border-gray-100 pt-3">
        {/* View attendance history button */}
        <button
          type="button"
          title="View attendance history"
          onClick={() => onViewAttendance(employee)}
          className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Reset password button — only shown if handler is provided */}
        {onResetPassword ? (
          <button
            type="button"
            title="Generate reset link"
            onClick={() => onResetPassword(employee)}
            className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-[#EFF6FF] hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
          >
            <Key className="h-4 w-4" />
          </button>
        ) : null}

        {/* Edit employee button */}
        <button
          type="button"
          title="Edit employee"
          onClick={() => onEdit(employee)}
          className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-[#EFF6FF] hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Delete / deactivate employee button */}
        <button
          type="button"
          title="Deactivate employee"
          onClick={() => onDelete(employee)}
          className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default EmployeeCard
