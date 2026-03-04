import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CalendarDays, Clock, CheckCircle2, Activity,
  X, AlertTriangle, Info, ChevronRight,
  TrendingUp, ArrowRightLeft, Zap, Bell, ArrowRight,
  LogOut as LeaveIcon, ClipboardList,
} from "lucide-react";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const getStatus = (start, end) => {
  const n = Date.now();
  if (n < new Date(start)) return "upcoming";
  if (end && n <= new Date(end)) return "ongoing";
  return "completed";
};

const STATUS = {
  upcoming: { label: "Upcoming", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  ongoing: { label: "Ongoing", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

/* ════════════════════════════════════════════════════════════
   LIVE CLOCK
════════════════════════════════════════════════════════════ */
const LiveClock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="text-right hidden sm:block">
      <p className="text-2xl font-bold text-white tabular-nums tracking-tight">
        {t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-emerald-200 text-xs mt-0.5">
        {t.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   KPI STAT CARD
════════════════════════════════════════════════════════════ */
const KpiCard = ({ icon: Icon, label, value, sub, gradient }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200 group">
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" />{sub}</p>}
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   ALERT ITEM
════════════════════════════════════════════════════════════ */
const AlertItem = ({ message }) => {
  const low = message.toLowerCase();
  const warn = low.includes("pending") || low.includes("leave") || low.includes("change");
  const good = low.includes("approved") || low.includes("complete");
  const Icon = warn ? AlertTriangle : good ? CheckCircle2 : Info;
  const cls = warn ? "bg-amber-50 border-amber-200 text-amber-700"
    : good ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-blue-50 border-blue-200 text-blue-700";
  const ic = warn ? "text-amber-500" : good ? "text-emerald-500" : "text-blue-500";
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl px-3 py-2.5 text-sm ${cls}`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${ic}`} />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════════ */
const Sk = ({ className }) => <div className={`bg-slate-200 animate-pulse rounded-xl ${className}`} />;
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 p-8 space-y-6">
    <Sk className="h-40 w-full rounded-3xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <Sk key={i} className="h-28" />)}
    </div>
    <div className="grid lg:grid-cols-3 gap-6">
      <Sk className="lg:col-span-2 h-44" />
      <Sk className="h-44" />
    </div>
    <Sk className="h-72" />
  </div>
);

/* ════════════════════════════════════════════════════════════
   SHIFT DETAIL MODAL (slide-in from right — same as manager)
════════════════════════════════════════════════════════════ */
const ShiftModal = ({ shift, onClose, onLeave, onChange }) => {
  if (!shift) return null;
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const st = STATUS[status];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4 sm:p-0" onClick={onClose}>
      <div className="bg-white h-full w-full sm:w-[420px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight">{shift.shiftTitle}</h2>
              <p className="text-emerald-100 text-sm mt-2">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition text-white shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notes */}
        {shift.shiftNotes && (
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-slate-700 leading-relaxed">{shift.shiftNotes}</p>
          </div>
        )}

        {/* Manager info */}
        {shift.createdByManager && (
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Posted By</p>
            <p className="text-sm font-semibold text-slate-700">{shift.createdByManager.username || "Manager"}</p>
          </div>
        )}

        {/* Actions (only upcoming) */}
        {status === "upcoming" && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Actions</p>
            <button
              onClick={() => { onChange(shift); onClose(); }}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
            >
              <ArrowRightLeft size={15} />
              Request Shift Change
            </button>
            <button
              onClick={() => { onLeave(shift); onClose(); }}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <LeaveIcon size={15} />
              Request Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN EMPLOYEE DASHBOARD
════════════════════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const [shifts, setShifts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    Promise.all([
      API.get("/api/employee/shifts/myshifts"),
      API.get("/api/employee/shifts/requests"),
    ])
      .then(([shiftRes, reqRes]) => {
        setShifts(Array.isArray(shiftRes.data?.data) ? shiftRes.data.data : []);
        setRequests(Array.isArray(reqRes.data?.data) ? reqRes.data.data : []);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) return <LoadingScreen />;

  /* KPI values */
  const totalShifts = shifts.length;
  const upcomingShifts = shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "upcoming").length;
  const completedShifts = shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "completed").length;
  const pendingRequests = requests.filter(r => r.status === "pending").length;

  /* Next upcoming shift */
  const nextShift = shifts
    .filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "upcoming")
    .sort((a, b) => new Date(a.shiftStartTime) - new Date(b.shiftStartTime))[0];

  /* Build alerts */
  const alerts = [];
  if (pendingRequests > 0) alerts.push(`${pendingRequests} request${pendingRequests > 1 ? "s" : ""} pending manager approval`);
  requests.filter(r => r.status === "approved").slice(0, 2).forEach(r =>
    alerts.push(`Your ${r.type === "leave" ? "leave" : "shift change"} request was approved ✓`)
  );
  requests.filter(r => r.status === "rejected").slice(0, 1).forEach(r =>
    alerts.push(`Your ${r.type === "leave" ? "leave" : "shift change"} request was rejected`)
  );
  if (nextShift) alerts.push(`Next shift: ${fmtDate(nextShift.shiftStartTime)} at ${fmtTime(nextShift.shiftStartTime)}`);
  if (alerts.length === 0) alerts.push("All shifts are up to date ✓");

  /* Recent shifts (last 6) */
  const recentShifts = [...shifts]
    .sort((a, b) => new Date(b.shiftStartTime) - new Date(a.shiftStartTime))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ══════════════════════════════════════════════════════
          HERO BANNER (emerald — matches employee theme)
      ══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 md:px-8 py-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-24 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-4 right-64 w-16 h-16 rounded-full bg-white/5" />

        <div className="max-w-6xl mx-auto flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Live</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {greeting()}, {user?.username || "Employee"}!
            </h1>
            <p className="text-emerald-100 text-sm mt-1.5">
              Here's your shift overview for today.
            </p>

            {/* Quick action links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { label: "Available Shifts", path: "/employee/AllShifts" },
                { label: "My Shifts", path: "/employee/myshifts" },
                { label: "My Requests", path: "/employee/requests" },
              ].map(lnk => (
                <button
                  key={lnk.path}
                  onClick={() => navigate(lnk.path)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg transition-colors border border-white/20"
                >
                  {lnk.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
          <LiveClock />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-7">

        {/* ══════════════════════════════════════════════════════
            KPI CARDS
        ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={CalendarDays} label="My Total Shifts" value={totalShifts} gradient="from-emerald-500 to-teal-600" sub="Accepted shifts" />
          <KpiCard icon={Zap} label="Upcoming" value={upcomingShifts} gradient="from-blue-600 to-indigo-600" sub="Scheduled ahead" />
          <KpiCard icon={CheckCircle2} label="Completed" value={completedShifts} gradient="from-violet-500 to-purple-600" sub="Successfully done" />
          <KpiCard icon={ClipboardList} label="Pending Requests" value={pendingRequests} gradient="from-orange-500 to-amber-500" sub="Awaiting approval" />
        </div>

        {/* ══════════════════════════════════════════════════════
            NEXT SHIFT + ALERTS (2-col)
        ══════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Next Shift */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wider text-xs">Your Next Shift</p>
            </div>
            {nextShift ? (
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-tight">{nextShift.shiftTitle}</p>
                    <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{fmtDate(nextShift.shiftStartTime)}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtTime(nextShift.shiftStartTime)} — {fmtTime(nextShift.shiftEndTime)}</span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Upcoming
                </span>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center py-12 text-slate-400">
                <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
                <p className="font-medium text-slate-500">No upcoming shifts</p>
                <button onClick={() => navigate("/employee/AllShifts")} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Browse available shifts →</button>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alerts</p>
              </div>
              {pendingRequests > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {pendingRequests}
                </span>
              )}
            </div>
            <div className="p-4 space-y-2 max-h-44 overflow-y-auto">
              {alerts.map((n, i) => <AlertItem key={i} message={n} />)}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            MY RECENT SHIFTS TABLE
        ══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">My Shifts</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click a row to view details or take actions</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1.5 rounded-full">
                {totalShifts} total
              </span>
              <button
                onClick={() => navigate("/employee/myshifts")}
                className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {recentShifts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentShifts.map(shift => {
                    const st = STATUS[getStatus(shift.shiftStartTime, shift.shiftEndTime)];
                    return (
                      <tr
                        key={shift._id}
                        onClick={() => setSelected(shift)}
                        className="hover:bg-emerald-50/30 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                              <CalendarDays className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {shift.shiftTitle}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-slate-700">{fmtDate(shift.shiftStartTime)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 ml-auto transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 flex flex-col items-center text-center text-slate-400">
              <CalendarDays className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-slate-500">No shifts yet</p>
              <button onClick={() => navigate("/employee/AllShifts")} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">
                Browse available shifts →
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Shift Detail Drawer */}
      <ShiftModal
        shift={selected}
        onClose={() => setSelected(null)}
        onLeave={(s) => navigate("/employee/myshifts", { state: { openLeave: s._id } })}
        onChange={(s) => navigate("/employee/myshifts", { state: { openChange: s._id } })}
      />
    </div>
  );
};

export default EmployeeDashboard;
