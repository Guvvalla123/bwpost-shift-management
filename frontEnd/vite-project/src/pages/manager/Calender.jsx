import React, { useEffect, useState, useCallback } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import API from "@/api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";
import {
  LogOut, RefreshCw, Calendar, Clock,
  MapPin, AlignLeft, Users, X, ExternalLink,
  ChevronRight, Plus, PanelLeftOpen, PanelLeftClose,
  Briefcase, UserCheck, StickyNote,
} from "lucide-react";
import "../../calender.css";

/* ─── Google Calendar API helpers ──────────────────────────── */
const GC_API = "https://www.googleapis.com/calendar/v3";

const fetchGoogleEvents = async (accessToken) => {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  const threeMonthsAhead = new Date(now);
  threeMonthsAhead.setMonth(now.getMonth() + 3);

  const res = await fetch(
    `${GC_API}/calendars/primary/events?` +
    new URLSearchParams({
      timeMin: oneMonthAgo.toISOString(),
      timeMax: threeMonthsAhead.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "500",
    }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch Google Calendar events");
  const data = await res.json();
  return data.items || [];
};

const createGoogleEvent = async (accessToken, event) => {
  const res = await fetch(`${GC_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
};

/* ─── Convert Google event → FullCalendar event ─────────────── */
const mapGoogleEvent = (ev) => ({
  id: ev.id,
  title: ev.summary || "(No title)",
  start: ev.start?.dateTime || ev.start?.date,
  end: ev.end?.dateTime || ev.end?.date,
  allDay: !ev.start?.dateTime,
  backgroundColor: "#0ea5e9",
  borderColor: "transparent",
  extendedProps: {
    source: "google",
    description: ev.description || "",
    location: ev.location || "",
    attendees: ev.attendees || [],
    htmlLink: ev.htmlLink,
    status: ev.status,
  },
});

/* ─── Format helpers ─────────────────────────────────────────── */
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric",
    })
    : "";
const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit", minute: "2-digit",
    })
    : "";

/* ═══════════════════════════════════════════════════════════════ */
/* GOOGLE SIGN-IN SCREEN                                           */
/* ═══════════════════════════════════════════════════════════════ */
const SignInScreen = ({ onLogin }) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#f1f5f9] px-4">
    <div className="w-full max-w-sm text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-[#162d5e] shadow-lg flex items-center justify-center">
          <Calendar className="w-10 h-10 text-white" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Google Calendar</h1>
        <p className="text-slate-500 text-sm mt-2">
          Sign in with your Google account to view calendar events and sync work shifts.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 text-left">
        {[
          { icon: Calendar, text: "View your calendar events" },
          { icon: Plus, text: "Create and manage events" },
          { icon: Users, text: "See event attendees" },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-slate-700">{text}</p>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
          </div>
        ))}
      </div>

      <button
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 shadow-sm hover:shadow-md py-3.5 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>

      <p className="text-xs text-slate-400">
        We only request read/write access to your Google Calendar.
      </p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
/* EVENT DETAIL POPUP — SHIFT                                      */
/* ═══════════════════════════════════════════════════════════════ */
const ShiftPopup = ({ event, onClose, onSync, syncing }) => {
  if (!event) return null;
  const p = event.extendedProps;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2 w-full bg-[#2563EB]" />

        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-slate-900 leading-tight pr-4">
            {event.title}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-700">
              <p>{fmtDate(event.start)}</p>
              {!event.allDay && (
                <p className="text-slate-500 text-xs mt-0.5">
                  {fmtTime(event.startStr)} — {fmtTime(event.endStr)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <UserCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">
              {p.accepted || 0} assigned · {p.slots || 0} slots remaining
            </p>
          </div>

          {p.notes && (
            <div className="flex items-start gap-3">
              <StickyNote className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-4">
                {p.notes}
              </p>
            </div>
          )}

          {onSync && (
            <button
              onClick={() => onSync(p.shiftId)}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 mt-2 pt-3 border-t border-slate-100 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {syncing ? "Syncing…" : "Sync to Google Calendar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/* EVENT DETAIL POPUP — GOOGLE                                     */
/* ═══════════════════════════════════════════════════════════════ */
const GooglePopup = ({ event, onClose }) => {
  if (!event) return null;
  const p = event.extendedProps;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2 w-full bg-sky-500" />

        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-slate-900 leading-tight pr-4">
            {event.title}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-700">
              <p>{fmtDate(event.start)}</p>
              {!event.allDay && (
                <p className="text-slate-500 text-xs mt-0.5">
                  {fmtTime(event.startStr)} — {fmtTime(event.endStr)}
                </p>
              )}
            </div>
          </div>

          {p.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700">{p.location}</p>
            </div>
          )}

          {p.description && (
            <div className="flex items-start gap-3">
              <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-4">
                {p.description}
              </p>
            </div>
          )}

          {p.attendees?.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-1">{p.attendees.length} guests</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.attendees.slice(0, 4).map((a, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {a.displayName || a.email}
                    </span>
                  ))}
                  {p.attendees.length > 4 && (
                    <span className="text-xs text-slate-400">+{p.attendees.length - 4} more</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {p.htmlLink && (
            <a
              href={p.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline mt-2 pt-3 border-t border-slate-100"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Google Calendar
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                  */
/* ═══════════════════════════════════════════════════════════════ */
const CalendarPage = () => {
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [appShifts, setAppShifts] = useState([]);
  const [syncing, setSyncing] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calendarStart, setCalendarStart] = useState(null);
  const [calendarEnd, setCalendarEnd] = useState(null);

  const fetchAppShifts = useCallback(async () => {
    if (!calendarStart || !calendarEnd) return;
    try {
      const params = new URLSearchParams({
        startDate: calendarStart,
        endDate: calendarEnd,
        limit: "50",
        page: "1",
      });
      const res = await API.get(`/api/manager/shifts?${params}`);
      const { data } = res.data;
      const list = Array.isArray(data) ? data : [];
      const rangeStart = new Date(calendarStart).getTime();
      const rangeEnd = new Date(calendarEnd).getTime();
      setAppShifts(
        list.filter((s) => {
          const st = new Date(s.shiftStartTime).getTime();
          const en = new Date(s.shiftEndTime).getTime();
          return st < rangeEnd && en > rangeStart;
        })
      );
    } catch {
      toast.error("Failed to load shifts for calendar");
    }
  }, [calendarStart, calendarEnd]);

  const handleDatesSet = (dateInfo) => {
    setCalendarStart(dateInfo.startStr);
    setCalendarEnd(dateInfo.endStr);
  };

  const login = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar",
    onSuccess: async (codeResponse) => {
      setToken(codeResponse.access_token);
      try {
        const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${codeResponse.access_token}` },
        }).then((r) => r.json());
        setUserInfo(info);
      } catch { }
    },
    onError: () => toast.error("Google sign-in failed"),
  });

  useEffect(() => {
    if (!token) return;
    setLoadingEvents(true);
    fetchGoogleEvents(token)
      .then((items) => setEvents(items.map(mapGoogleEvent)))
      .catch(() => toast.error("Could not load Google Calendar events"))
      .finally(() => setLoadingEvents(false));
  }, [token]);

  useEffect(() => {
    if (calendarStart && calendarEnd) {
      fetchAppShifts();
    }
  }, [calendarStart, calendarEnd, fetchAppShifts]);

  const shiftEvents = appShifts.map((s) => ({
    id: `shift-${s._id}`,
    title: s.shiftTitle,
    start: s.shiftStartTime,
    end: s.shiftEndTime,
    backgroundColor: "#6366f1",
    borderColor: "transparent",
    extendedProps: {
      source: "app",
      shiftId: s._id,
      notes: s.shiftNotes,
      slots: s.slotsAvailable,
      accepted: s.acceptedEmployees?.length || 0,
    },
  }));

  const syncShiftToGoogle = async (shiftId) => {
    const shift = appShifts.find((s) => s._id === shiftId);
    if (!shift) return;
    if (!token) return toast.error("Please sign in with Google first");
    setSyncing(shiftId);
    try {
      await createGoogleEvent(token, {
        summary: shift.shiftTitle,
        description: shift.shiftNotes || `Shift: ${shift.shiftTitle}\nSlots: ${shift.slotsAvailable}`,
        start: { dateTime: shift.shiftStartTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: shift.shiftEndTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        colorId: "7",
      });
      toast.success(`"${shift.shiftTitle}" synced to Google Calendar`);
      const updated = await fetchGoogleEvents(token);
      setEvents(updated.map(mapGoogleEvent));
    } catch {
      toast.error("Failed to sync shift");
    } finally {
      setSyncing(null);
    }
  };

  const handleLogout = () => {
    googleLogout();
    setToken(null);
    setUserInfo(null);
    setEvents([]);
    toast.success("Signed out from Google");
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
  };

  const handleRefresh = async () => {
    if (!token) return;
    setLoadingEvents(true);
    try {
      const items = await fetchGoogleEvents(token);
      setEvents(items.map(mapGoogleEvent));
      toast.success("Calendar refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setLoadingEvents(false);
    }
  };

  if (!token) {
    return <SignInScreen onLogin={login} />;
  }

  const selectedSource = selectedEvent?.extendedProps?.source;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f1f5f9] overflow-hidden">

      {/* ── Mobile sidebar overlay ────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Left Panel: Shift Sync List ───────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* User Profile */}
        {userInfo && (
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <img
              src={userInfo.picture}
              alt={userInfo.name}
              className="w-9 h-9 rounded-full ring-2 ring-white shadow"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{userInfo.name}</p>
              <p className="text-xs text-slate-400 truncate">{userInfo.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors shrink-0 ml-auto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sync Shifts</p>
          <p className="text-xs text-slate-400">Push work shifts into Google Calendar</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {appShifts.length === 0 ? (
            <div className="py-10 text-center text-slate-300">
              <Briefcase className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">No shifts found</p>
            </div>
          ) : (
            appShifts.map((shift) => (
              <div
                key={shift._id}
                className="bg-slate-50 hover:bg-[#EFF6FF] border border-slate-100 hover:border-[#BFDBFE] rounded-xl p-3 transition-all group"
              >
                <p className="text-xs font-semibold text-slate-800 truncate mb-1 group-hover:text-[#1B3F8B]">
                  {shift.shiftTitle}
                </p>
                <p className="text-[11px] text-slate-400 mb-0.5">
                  {fmtDate(shift.shiftStartTime)}
                </p>
                <p className="text-[11px] text-slate-400 mb-2">
                  {shift.acceptedEmployees?.length || 0} assigned · {shift.slotsAvailable} slots left
                </p>
                <button
                  onClick={() => syncShiftToGoogle(shift)}
                  disabled={syncing === shift._id}
                  className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-[#1B3F8B] hover:text-white hover:border-[#1B3F8B] transition-all font-medium disabled:opacity-50"
                >
                  {syncing === shift._id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {syncing === shift._id ? "Syncing…" : "Add to Google"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legend</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#2563EB] shrink-0" />
            <span className="text-xs text-slate-600">Work shifts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-sky-500 shrink-0" />
            <span className="text-xs text-slate-600">Google Calendar</span>
          </div>
        </div>
      </div>

      {/* ── Main Calendar ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Single header bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>

          {userInfo && (
            <div className="hidden sm:flex items-center gap-2">
              <img src={userInfo.picture} alt="" className="w-7 h-7 rounded-full" />
              <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{userInfo.name}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {loadingEvents && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FullCalendar */}
        <div className="flex-1 p-2 sm:p-4 min-h-0 calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="100%"
            selectable={false}
            nowIndicator
            editable={false}
            allDaySlot
            dayMaxEvents={3}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            slotDuration="00:30"
            slotLabelInterval="01:00"
            dayHeaderFormat={{ weekday: "short", day: "numeric" }}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            datesSet={handleDatesSet}
            events={[...shiftEvents, ...events]}
            eventClick={handleEventClick}
            eventClassNames="cursor-pointer"
          />
        </div>
      </div>

      {/* ── Event Popups ────────────────────────────────────────── */}
      {selectedEvent && selectedSource === "app" && (
        <ShiftPopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSync={token ? (id) => syncShiftToGoogle(id) : null}
          syncing={syncing === selectedEvent.extendedProps?.shiftId}
        />
      )}
      {selectedEvent && selectedSource === "google" && (
        <GooglePopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default CalendarPage;
