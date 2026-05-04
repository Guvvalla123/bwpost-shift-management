import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react'

const AVATAR_GRADIENTS = [
  'from-blue-600 to-[#162d5e]',
  'from-violet-600 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
]

function getAvatarGradient(name = '') {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length]
}

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

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EmployeeAttendanceDrawer({
  employee,
  attendanceHistory,
  attendanceLoading,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!employee) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={() => onClose()}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300 animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#162d5e] px-6 pb-10 pt-8">
          <button
            type="button"
            onClick={() => onClose()}
            className="mb-6 flex items-center gap-1.5 text-sm text-blue-100 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(employee.username)} text-2xl font-bold text-white shadow-lg ring-4 ring-white/20`}
            >
              {getInitials(employee.username)}
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {employee.username}
              </p>
              <p className="mt-0.5 text-sm text-blue-200">{employee.email}</p>
            </div>
          </div>
        </div>

        <div className="-mt-5 mx-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Role
              </p>
              <p className="truncate text-sm font-semibold text-gray-800">
                {(employee.role || 'employee') === 'manager'
                  ? 'Manager'
                  : 'Employee'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Joined
              </p>
              <p className="truncate text-sm font-semibold text-gray-800">
                {fmtDate(employee.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Attendance History
          </p>

          {attendanceLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : attendanceHistory.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Clock className="mb-2 h-10 w-10 opacity-30" />
              <p className="text-sm">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceHistory.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="truncate pr-2 text-sm font-semibold text-gray-800">
                      {rec.shiftTitle || 'Shift'}
                    </p>
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {rec.totalHours != null ? `${rec.totalHours}h` : '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <p className="mb-0.5 text-gray-400">Check In</p>
                      <p className="font-medium text-gray-700">
                        {fmtDate(rec.checkIn)} {fmtTime(rec.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-gray-400">Check Out</p>
                      <p className="font-medium text-gray-700">
                        {fmtDate(rec.checkOut)} {fmtTime(rec.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(employee)
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#162d5e] py-2.5 text-sm font-semibold text-white transition hover:shadow-md"
          >
            <Pencil className="h-4 w-4" /> Edit Employee
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onDelete(employee)
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
