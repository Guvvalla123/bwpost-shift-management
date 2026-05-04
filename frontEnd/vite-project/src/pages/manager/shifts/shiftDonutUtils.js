import { getStatus } from '@/utils/shiftStatus'

export const DONUT_COLORS = {
  ongoing: '#059669',
  upcoming: '#1B3F8B',
  needsStaff: '#f59e0b',
  completed: '#d1d5db',
}

export function classifyForDonut(shift) {
  const s = getStatus(shift.shiftStartTime, shift.shiftEndTime)
  const openSlots = shift.slotsAvailable ?? 0
  if (s === 'ongoing') return 'ongoing'
  if (s === 'completed') return 'completed'
  if (s === 'upcoming' && openSlots > 0) return 'needsStaff'
  if (s === 'upcoming') return 'upcoming'
  return 'completed'
}

export function scaleCounts(raw, total) {
  const keys = ['ongoing', 'upcoming', 'needsStaff', 'completed']
  const sum = keys.reduce((acc, k) => acc + raw[k], 0)
  if (total <= 0 || sum <= 0)
    return { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 }
  const scaled = keys.map((k) => Math.round((raw[k] / sum) * total))
  const diff = total - scaled.reduce((a, b) => a + b, 0)
  const maxIdx = scaled.indexOf(Math.max(...scaled))
  scaled[maxIdx] += diff
  return {
    ongoing: scaled[0],
    upcoming: scaled[1],
    needsStaff: scaled[2],
    completed: scaled[3],
  }
}

export function buildDonutSegments(dashData) {
  if (!dashData) return { donutChartData: [], donutTotal: 0 }

  const totalShiftCount = dashData.stats?.totalShifts ?? 0
  const rawCounts = { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 }
  for (const shift of dashData.recentShifts || []) {
    const category = classifyForDonut(shift)
    rawCounts[category] += 1
  }
  const scaledCounts = scaleCounts(rawCounts, totalShiftCount)

  const donutChartData = [
    {
      name: 'Ongoing',
      value: scaledCounts.ongoing,
      color: DONUT_COLORS.ongoing,
    },
    {
      name: 'Upcoming',
      value: scaledCounts.upcoming,
      color: DONUT_COLORS.upcoming,
    },
    {
      name: 'Needs staff',
      value: scaledCounts.needsStaff,
      color: DONUT_COLORS.needsStaff,
    },
    {
      name: 'Completed',
      value: scaledCounts.completed,
      color: DONUT_COLORS.completed,
    },
  ]
  return { donutChartData, donutTotal: totalShiftCount }
}
