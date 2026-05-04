import { memo } from 'react'
import { Pencil, Trash2, Eye, Key } from 'lucide-react'

const formatJoinDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const initialsFrom = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

function ShiftRow({ employee, onEdit, onDelete, onView, onPasswordReset }) {
  const initials = initialsFrom(employee.username)
  const active = employee.isActive !== false
  const role = employee.role || 'employee'
  const roleLabel = role === 'manager' ? 'Manager' : 'Employee'

  return (
    <tr className="group transition-colors duration-150 even:bg-slate-50/50 hover:bg-blue-50/40">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3F8B] text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {employee.username}
              </p>
              <span className="inline-flex items-center rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1B3F8B]">
                {roleLabel}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {employee.email}
            </p>
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            active
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-700 ring-1 ring-red-200'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          {active ? 'Active' : 'Inactive'}
        </span>
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {formatJoinDate(employee.createdAt)}
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={() => onView(employee)}
            title="View details"
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1B3F8B]"
          >
            <Eye className="h-4 w-4" />
          </button>
          {onPasswordReset ? (
            <button
              type="button"
              onClick={() => onPasswordReset(employee)}
              title="Generate Reset Link"
              className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#1B3F8B]"
            >
              <Key className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(employee)}
            title="Edit employee"
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#1B3F8B]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(employee)}
            title="Remove employee"
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default memo(ShiftRow)
