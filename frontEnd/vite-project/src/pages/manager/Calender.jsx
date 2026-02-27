import React, { useEffect, useState, useCallback } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";
import {
  LogIn, LogOut, RefreshCw, Calendar, Clock,
  MapPin, AlignLeft, Users, X, ExternalLink,
  ChevronRight, Plus, AlertCircle,
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
  backgroundColor: ev.colorId ? COLOR_MAP[ev.colorId] || "#1a73e8" : "#1a73e8",
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

/* Google Calendar event colors map */
const COLOR_MAP = {
  1: "#7986cb", 2: "#33b679", 3: "#8e24aa", 4: "#e67c73",
  5: "#f6c026", 6: "#f5511d", 7: "#039be5", 8: "#616161",
  9: "#3f51b5", 10: "#0b8043", 11: "#d60000",
};

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
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 px-4">
    <div className="w-full max-w-sm text-center space-y-6">
      {/* Google Calendar Icon */}
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-3xl bg-white shadow-lg border border-slate-100 flex items-center justify-center">
          <svg viewBox="0 0 87.3 78" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65 4.5-6.65z" fill="#0066da" />
            <path d="m14.95 73.5 3.85-6.65h-8.35z" fill="#0066da" />
            <path d="m14.95 73.5h-8.35l4.5 6.65z" fill="#00ac47" />
            <path d="m6.6 66.85-4.5 6.65 3.85 6.65 4.5-6.65z" fill="#00832d" />
            <path d="m21.4 66.85h-6.45l-8.35 13.3h6.45z" fill="#00ac47" />
            <path d="m14.95 60.2h6.45l-6.45 6.65z" fill="#0066da" />
            <path d="m21.4 60.2h-6.45l-2.06 6.65z" fill="#2684fc" />
          </svg>
          <Calendar className="w-10 h-10 text-blue-600 absolute" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Google Calendar</h1>
        <p className="text-slate-500 text-sm mt-2">
          Sign in with your Google account to view your calendar events and sync your work shifts.
        </p>
      </div>

      {/* Permission list */}
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

      {/* Sign In Button */}
      <button
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 shadow-sm hover:shadow-md py-3.5 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
      >
        {/* Google logo */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>

      <p className="text-xs text-slate-400">
        We only request read/write access to your Google Calendar. No other data is accessed.
      </p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
/* EVENT DETAIL POPUP                                              */
/* ═══════════════════════════════════════════════════════════════ */
const EventPopup = ({ event, onClose }) => {
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
        {/* Color bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: event.backgroundColor || "#1a73e8" }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-slate-900 leading-tight pr-4">
            {event.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="px-5 pb-5 space-y-3">
          {/* Date / Time */}
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

          {/* Location */}
          {p.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700">{p.location}</p>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <div className="flex items-start gap-3">
              <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-4">
                {p.description}
              </p>
            </div>
          )}

          {/* Attendees */}
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

          {/* Open in Google Calendar */}
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

  /* ── App shifts (from your backend) ── */
  const [appShifts, setAppShifts] = useState([]);
  const [syncing, setSyncing] = useState(null); // shiftId being synced

  /* ── Fetch app shifts ── */
  const fetchAppShifts = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/manager/shifts?limit=200",
        { withCredentials: true }
      );
      setAppShifts(res.data.data || []);
    } catch {
      /* silent fail if not logged into app */
    }
  }, []);

  /* ── Google OAuth Login ── */
  const login = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar",
    onSuccess: async (codeResponse) => {
      setToken(codeResponse.access_token);
      // fetch basic user info
      try {
        const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${codeResponse.access_token}` },
        }).then((r) => r.json());
        setUserInfo(info);
      } catch { }
    },
    onError: () => toast.error("Google sign-in failed"),
  });

  /* ── Load Google events after login ── */
  useEffect(() => {
    if (!token) return;
    setLoadingEvents(true);
    fetchGoogleEvents(token)
      .then((items) => setEvents(items.map(mapGoogleEvent)))
      .catch(() => toast.error("Could not load Google Calendar events"))
      .finally(() => setLoadingEvents(false));
  }, [token]);

  /* ── Load app shifts ── */
  useEffect(() => {
    fetchAppShifts();
  }, [fetchAppShifts]);

  /* ── App shifts as gray read-only events ── */
  const shiftEvents = appShifts.map((s) => ({
    id: `shift-${s._id}`,
    title: `🏢 ${s.shiftTitle}`,
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

  /* ── Sync a shift → Google Calendar ── */
  const syncShiftToGoogle = async (shift) => {
    if (!token) return toast.error("Please sign in with Google first");
    setSyncing(shift._id);
    try {
      await createGoogleEvent(token, {
        summary: shift.shiftTitle,
        description: shift.shiftNotes || `Shift: ${shift.shiftTitle}\nSlots: ${shift.slotsAvailable}`,
        start: { dateTime: shift.shiftStartTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: shift.shiftEndTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        colorId: "7", // Google blue
      });
      toast.success(`"${shift.shiftTitle}" synced to Google Calendar ✓`);
      // Refresh Google events
      const updated = await fetchGoogleEvents(token);
      setEvents(updated.map(mapGoogleEvent));
    } catch {
      toast.error("Failed to sync shift to Google Calendar");
    } finally {
      setSyncing(null);
    }
  };

  /* ── Logout ── */
  const handleLogout = () => {
    googleLogout();
    setToken(null);
    setUserInfo(null);
    setEvents([]);
    toast.success("Signed out from Google");
  };

  /* ── Event click ── */
  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
  };

  /* ═══════ SIGN-IN SCREEN ═══════ */
  if (!token) {
    return <SignInScreen onLogin={login} />;
  }

  /* ═══════ CALENDAR VIEW ═══════ */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">

      {/* ── Left Panel: Shift Sync List ───────────────────────── */}
      <div className="hidden xl:flex w-72 flex-col bg-white border-r border-slate-100 shrink-0">

        {/* User Profile strip */}
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

        {/* Shift Sync Panel */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Sync Shifts
          </p>
          <p className="text-xs text-slate-400">Push your work shifts into Google Calendar</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {appShifts.length === 0 ? (
            <div className="py-10 text-center text-slate-300">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">No shifts found</p>
            </div>
          ) : (
            appShifts.map((shift) => (
              <div
                key={shift._id}
                className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl p-3 transition-all group"
              >
                <p className="text-xs font-semibold text-slate-800 truncate mb-1 group-hover:text-blue-700">
                  {shift.shiftTitle}
                </p>
                <p className="text-[11px] text-slate-400 mb-2">
                  {fmtDate(shift.shiftStartTime)}
                </p>
                <button
                  onClick={() => syncShiftToGoogle(shift)}
                  disabled={syncing === shift._id}
                  className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-medium disabled:opacity-50"
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
            <span className="w-3 h-3 rounded-sm bg-indigo-500 shrink-0" />
            <span className="text-xs text-slate-600">Shift schedule</span>
          </div>
        </div>
      </div>

      {/* ── Main Calendar ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">Google Calendar</span>
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {loadingEvents && (
              <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
            )}

            {/* Refresh */}
            <button
              onClick={async () => {
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
              }}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh calendar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="xl:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>

        {/* FullCalendar */}
        <div className="flex-1 p-4 min-h-0 calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            height="100%"
            selectable={false}
            nowIndicator
            editable={false}
            allDaySlot
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
            events={shiftEvents}
            eventClick={handleEventClick}
            eventClassNames="cursor-pointer"
          />
        </div>
      </div>

      {/* ── Event Detail Popup ─── */}
      {selectedEvent && (
        <EventPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

export default CalendarPage;
