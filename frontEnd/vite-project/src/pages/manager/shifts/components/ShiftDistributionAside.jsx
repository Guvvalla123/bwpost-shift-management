import React from 'react'
import { DonutChart } from '@/components/ui'
import { buildDonutSegments } from '../shiftDonutUtils'

function DonutLegend({ rows, total }) {
  const denominator = total > 0 ? total : 1
  return (
    <ul className="mt-2 w-full space-y-1.5">
      {rows.map((row) => {
        const barPercent = total > 0 ? (row.value / denominator) * 100 : 0
        return (
          <li key={row.name} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-gray-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-gray-900">
                {row.value}
              </span>
            </div>
            <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${barPercent}%`, backgroundColor: row.color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function ShiftDistributionAside({ dashData }) {
  const { donutChartData, donutTotal } = buildDonutSegments(dashData)

  return (
    <aside className="order-1 lg:order-2 lg:col-span-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Shift status</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          Distribution across all shifts
        </p>
        <div className="mt-4 flex flex-col items-center">
          <DonutChart
            data={donutChartData}
            size={120}
            centerValue={String(donutTotal)}
            centerLabel="Total"
          />
          <DonutLegend rows={donutChartData} total={donutTotal} />
        </div>
      </div>
    </aside>
  )
}
