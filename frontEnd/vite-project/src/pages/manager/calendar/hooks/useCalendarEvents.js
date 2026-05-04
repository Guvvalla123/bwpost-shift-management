import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import API from '@/api'
import { shiftService } from '@/api/services'

export function useCalendarEvents(calendarStart, calendarEnd) {
  const [appShifts, setAppShifts] = useState([])
  const [appShiftsLoading, setAppShiftsLoading] = useState(false)
  const [appShiftsError, setAppShiftsError] = useState(false)

  const fetchAppShifts = useCallback(async () => {
    if (!calendarStart || !calendarEnd) return
    setAppShiftsLoading(true)
    setAppShiftsError(false)
    try {
      const params = new URLSearchParams({
        startDate: calendarStart,
        endDate: calendarEnd,
        limit: '50',
        page: '1',
      })
      const res = await API.get(`/api/manager/shifts?${params}`)
      const { data } = res.data
      const list = Array.isArray(data) ? data : []
      const rangeStart = new Date(calendarStart).getTime()
      const rangeEnd = new Date(calendarEnd).getTime()
      setAppShifts(
        list.filter((s) => {
          const st = new Date(s.shiftStartTime).getTime()
          const en = new Date(s.shiftEndTime).getTime()
          return st < rangeEnd && en > rangeStart
        }),
      )
    } catch {
      setAppShiftsError(true)
      toast.error('Failed to load shifts for calendar. Please try again.')
    } finally {
      setAppShiftsLoading(false)
    }
  }, [calendarStart, calendarEnd])

  useEffect(() => {
    if (calendarStart && calendarEnd) fetchAppShifts()
  }, [calendarStart, calendarEnd, fetchAppShifts])

  const deleteCalendarShift = useCallback(async (shiftId) => {
    await shiftService.deleteShift(shiftId)
  }, [])

  return {
    appShifts,
    appShiftsLoading,
    appShiftsError,
    refetchAppShifts: fetchAppShifts,
    deleteCalendarShift,
  }
}
