import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import API from '@/api'
import { shiftService } from '@/api/services'
import {
  LogOut,
  RefreshCw,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  Briefcase,
  Loader2,
} from 'lucide-react'
import '../../../calendar.css'
import CalendarSignInSplash from './components/CalendarSignInSplash'
import CalendarView from './components/CalendarView'
import EventDetailsModal from './components/EventDetailsModal'
import GoogleSyncButton from './components/GoogleSyncButton'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'
import { fmtCalendarDate } from './calendarFormat'

const CalendarPage = () => {
  const navigate = useNavigate()

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const [calendarViewMode, setCalendarViewMode] = useState(undefined)

  const {
    token,
    userInfo,
    isAuthorized,
    login,
    logout,
    googleFcEvents,
    loadingGoogle,
    refreshGoogleEvents,
    syncShiftToGoogle,
    syncingShiftId,
  } = useGoogleCalendar()

  const [appShifts, setAppShifts] = useState([])
  const [appShiftsLoading, setAppShiftsLoading] = useState(false)
  const [appShiftsError, setAppShiftsError] = useState(false)

  const [calendarStart, setCalendarStart] = useState(null)
  const [calendarEnd, setCalendarEnd] = useState(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

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

  const handleDatesSet = (dateInfo) => {
    setCalendarStart(dateInfo.startStr)
    setCalendarEnd(dateInfo.endStr)
  }

  useEffect(() => {
    if (calendarStart && calendarEnd) fetchAppShifts()
  }, [calendarStart, calendarEnd, fetchAppShifts])

  const shiftEvents = appShifts.map((s) => ({
    id: `shift-${s._id}`,
    title: s.shiftTitle,
    start: s.shiftStartTime,
    end: s.shiftEndTime,
    backgroundColor: '#6366f1',
    borderColor: 'transparent',
    extendedProps: {
      source: 'app',
      shiftId: s._id,
      notes: s.shiftNotes,
      slots: s.slotsAvailable,
      accepted: s.acceptedEmployees?.length || 0,
    },
  }))

  const allEvents = [...shiftEvents, ...googleFcEvents]

  const handleEventClick = (info) => setSelectedEvent(info.event)

  const handleCloseModal = () => setSelectedEvent(null)

  const handleEditShift = (evt) => {
    if (!evt?.extendedProps?.shiftId) return
    handleCloseModal()
    navigate('/manager/shifts')
    toast.info('Opening Shifts — find this shift on the list to edit.')
  }

  const handleDeleteShift = async (evt) => {
    const id = evt?.extendedProps?.shiftId
    const title = evt?.title
    if (!id) return
    if (!window.confirm(`Remove shift "${title}"? This cannot be undone.`))
      return
    try {
      await shiftService.deleteShift(id)
      toast.success('Shift deleted')
      handleCloseModal()
      await fetchAppShifts()
      await refreshGoogleEvents()
    } catch {
      toast.error('Failed to delete shift')
    }
  }

  const handleSyncSidebar = (shiftId) => {
    syncShiftToGoogle(shiftId, appShifts)
  }

  if (!token) {
    return <CalendarSignInSplash onLogin={() => login()} />
  }

  return (
    <div className="flex max-h-[calc(100dvh-9rem)] min-h-[calc(100dvh-9rem)] flex-col overflow-hidden bg-[#F8F9FC] md:max-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-4rem)] md:flex-row lg:min-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)]">
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      ) : null}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-gray-100 bg-white
        transform transition-transform duration-300 ease-in-out
        md:relative md:z-auto md:w-[35%] md:min-w-0 md:max-w-none md:translate-x-0 md:shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {userInfo ? (
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <img
              src={userInfo.picture}
              alt=""
              className="w-9 h-9 rounded-full ring-2 ring-white shadow"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userInfo.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{userInfo.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors shrink-0 ml-auto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Google
          </p>
          <GoogleSyncButton
            isAuthorized={isAuthorized}
            onAuthorize={() => login()}
            onSync={refreshGoogleEvents}
            syncing={loadingGoogle}
          />
        </div>

        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Sync Shifts
          </p>
          <p className="text-xs text-gray-400">
            Push work shifts into Google Calendar
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {appShifts.length === 0 ? (
            <div className="py-10 text-center text-gray-300">
              <Briefcase className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">No shifts found</p>
            </div>
          ) : (
            appShifts.map((shift) => (
              <div
                key={shift._id}
                className="bg-gray-50 hover:bg-[#EFF6FF] border border-gray-100 hover:border-[#BFDBFE] rounded-xl p-3 transition-all group"
              >
                <p className="text-xs font-semibold text-gray-800 truncate mb-1 group-hover:text-[#1B3F8B]">
                  {shift.shiftTitle}
                </p>
                <p className="text-[11px] text-gray-400 mb-0.5">
                  {fmtCalendarDate(shift.shiftStartTime)}
                </p>
                <p className="text-[11px] text-gray-400 mb-2">
                  {shift.acceptedEmployees?.length || 0} assigned ·{' '}
                  {shift.slotsAvailable} slots left
                </p>
                <button
                  type="button"
                  onClick={() => handleSyncSidebar(shift._id)}
                  disabled={syncingShiftId === shift._id}
                  className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-[#1B3F8B] hover:text-white hover:border-[#1B3F8B] transition-all font-medium disabled:opacity-50"
                >
                  {syncingShiftId === shift._id ? (
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {syncingShiftId === shift._id ? 'Syncing…' : 'Add to Google'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Legend
          </p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#2563EB] shrink-0" />
            <span className="text-xs text-gray-600">Work shifts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-sky-500 shrink-0" />
            <span className="text-xs text-gray-600">Google Calendar</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white md:w-[65%]">
        <div className="px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visual shift schedule and planning
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 shrink-0 min-h-[56px]">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden -ml-2 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg p-3 text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
            title="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </button>

          {userInfo ? (
            <div className="hidden sm:flex items-center gap-2">
              <img
                src={userInfo.picture}
                alt=""
                className="w-7 h-7 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                {userInfo.name}
              </span>
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            {loadingGoogle ? (
              <Loader2
                className="w-4 h-4 text-gray-400 animate-spin"
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              onClick={refreshGoogleEvents}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <CalendarView
          events={allEvents}
          onEventClick={handleEventClick}
          view={calendarViewMode}
          onViewChange={(v) => setCalendarViewMode(v)}
          loading={appShiftsLoading}
          fetchError={appShiftsError}
          onRetry={fetchAppShifts}
          onDatesSet={handleDatesSet}
          isMobile={isMobile}
        />
      </div>

      <EventDetailsModal
        isOpen={Boolean(selectedEvent)}
        onClose={handleCloseModal}
        event={selectedEvent}
        onEdit={
          selectedEvent?.extendedProps?.source === 'app'
            ? handleEditShift
            : undefined
        }
        onDelete={
          selectedEvent?.extendedProps?.source === 'app'
            ? handleDeleteShift
            : undefined
        }
        onSyncShift={
          token && selectedEvent?.extendedProps?.source === 'app'
            ? (id) => syncShiftToGoogle(id, appShifts)
            : undefined
        }
        syncing={syncingShiftId === selectedEvent?.extendedProps?.shiftId}
      />
    </div>
  )
}

export default CalendarPage
