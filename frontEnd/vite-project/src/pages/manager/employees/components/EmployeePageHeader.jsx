import { Mail, UserPlus } from 'lucide-react'

export default function EmployeePageHeader({ onInvite, onAdd }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Employee Management
        </h1>
        <p className="mt-1 text-sm text-gray-400">Manage your team members</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onInvite}
          className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1B3F8B] bg-white px-4 text-sm font-semibold text-[#1B3F8B] shadow-sm transition-all duration-150 hover:bg-[#EFF6FF] active:scale-95 sm:w-auto"
        >
          <Mail className="h-4 w-4" strokeWidth={2} /> Invite Employee
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#162d5e] active:scale-95 sm:w-auto"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2} /> Add Employee
        </button>
      </div>
    </div>
  )
}
