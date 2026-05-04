import React, { useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ErrorState, SkeletonCalendarGrid } from '@/components/ui'

export default function CalendarView({
  events,
  onEventClick,
  onDateClick,
  view,
  onViewChange,
  loading = false,
  fetchError = false,
  onRetry,
  onDatesSet,
  isMobile,
}) {
  const calendarRef = useRef(null)

  const initialView = isMobile ? 'dayGridMonth' : 'dayGridMonth'

  useEffect(() => {
    if (!view || !calendarRef.current) return
    const api = calendarRef.current.getApi()
    if (api.view.type !== view) {
      try {
        api.changeView(view)
      } catch {
        /* invalid view key */
      }
    }
  }, [view])

  const handleDatesSet = (di) => {
    onDatesSet?.(di)
    onViewChange?.(di.view.type)
  }

  return (
    <div className="relative flex-1 p-2 sm:p-4 min-h-0 calendar-wrapper">
      {loading ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 p-4 backdrop-blur-[1px]"
          aria-busy="true"
        >
          <div className="w-full max-w-3xl rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <SkeletonCalendarGrid />
          </div>
        </div>
      ) : null}
      {fetchError && !loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/95 p-4">
          <div className="max-w-md">
            <ErrorState
              title="Failed to load shifts"
              description="Could not load shifts for the calendar. Please try again."
              onRetry={onRetry}
            />
          </div>
        </div>
      ) : null}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        height="100%"
        selectable={false}
        nowIndicator
        editable={false}
        allDaySlot
        dayMaxEvents={isMobile ? 2 : 3}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        slotDuration="00:30"
        slotLabelInterval="01:00"
        dayHeaderFormat={{ weekday: 'short' }}
        eventDisplay="block"
        headerToolbar={
          isMobile
            ? { left: 'prev,next', center: 'title', right: 'today' }
            : {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }
        }
        datesSet={handleDatesSet}
        events={events}
        eventClick={onEventClick}
        {...(typeof onDateClick === 'function'
          ? { dateClick: onDateClick }
          : {})}
        eventClassNames="cursor-pointer"
      />
    </div>
  )
}
