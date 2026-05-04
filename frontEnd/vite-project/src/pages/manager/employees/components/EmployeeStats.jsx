import { Users, UserCheck, UserPlus } from 'lucide-react'
import { KpiCard, DonutChart } from '@/components/ui'

export default function EmployeeStats({
  totalEmployees,
  activeEmployees,
  newThisMonth,
  loading,
}) {
  const donutData = [
    { name: 'Active', value: activeEmployees, color: '#059669' },
    {
      name: 'Inactive',
      value: Math.max(0, totalEmployees - activeEmployees),
      color: '#e5e7eb',
    },
  ]

  const showNew = typeof newThisMonth === 'number' && newThisMonth > 0

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7">
          {[0, 1].map((k) => (
            <div
              key={k}
              className="flex min-h-[100px] flex-col justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-14 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-5">
          <div className="mb-3 h-3 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-[100px] w-[100px] animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
      <div
        className={`grid gap-3 sm:gap-4 lg:col-span-7 ${
          showNew ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'
        }`}
      >
        <KpiCard
          variant="navy"
          icon={Users}
          label="Total Employees"
          value={totalEmployees}
        />
        <KpiCard
          variant="green"
          icon={UserCheck}
          label="Active Employees"
          value={activeEmployees}
        />
        {showNew ? (
          <KpiCard
            variant="default"
            icon={UserPlus}
            label="New This Month"
            value={newThisMonth}
          />
        ) : null}
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-5">
        <p className="mb-3 w-full text-center text-xs font-medium text-gray-500">
          Active vs inactive
        </p>
        <DonutChart
          data={donutData}
          size={100}
          centerValue={String(totalEmployees)}
          centerLabel="total"
        />
      </div>
    </div>
  )
}
