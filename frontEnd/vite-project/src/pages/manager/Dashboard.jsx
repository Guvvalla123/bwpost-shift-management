import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Users, CalendarDays, Clock, Activity,
  X, AlertTriangle, Info, CheckCircle2,
  ChevronRight, TrendingUp, UserCheck,
  BarChart2, Zap, Bell, ArrowRight,
} from "lucide-react";

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
  ongoing: { label: "Ongoing", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

/* Avatar gradient by name */
const GRADS = [
  "from-blue-600 to-indigo-600", "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600", "from-cyan-500 to-blue-600",
];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const initials = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

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
      <p className="text-blue-200 text-xs mt-0.5">
        {t.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   KPI STAT CARD(KEY PERFORMANCE INDICATOR CARDS) 
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
   SLOT PROGRESS
════════════════════════════════════════════════════════════ */
const SlotBar = ({ filled, total }) => {
  const pct = total > 0 ? Math.min(Math.round((filled / total) * 100), 100) : 0;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">{filled}/{total}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   ALERT ITEM
════════════════════════════════════════════════════════════ */
const AlertItem = ({ message }) => {
  const low = message.toLowerCase();
  const warn = low.includes("low") || low.includes("miss") || low.includes("short");
  const good = low.includes("full") || low.includes("complete");
  const Icon = warn ? AlertTriangle : good ? CheckCircle2 : Info;
  const cls = warn
    ? "bg-amber-50 border-amber-200 text-amber-700"
    : good
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
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
   SHIFT DETAIL MODAL (right-aligned panel style)
════════════════════════════════════════════════════════════ */
const ShiftModal = ({ shift, onClose }) => {
  if (!shift) return null;
  const filled = shift.acceptedEmployees?.length || 0;
  const total = shift.slotsAvailable || 0;
  const pct = total > 0 ? Math.min(Math.round((filled / total) * 100), 100) : 0;
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const st = STATUS[status];
  const bar = pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : "bg-amber-400";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4 sm:p-0"
      onClick={onClose}>
      <div className="bg-white h-full w-full sm:w-[420px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight truncate">{shift.shiftTitle}</h2>
              <p className="text-blue-200 text-sm mt-2">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition text-white shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Capacity */}
        <div className="p-6 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Slot Capacity</p>
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-slate-900 tabular-nums">{filled}</span>
              <span className="text-slate-400 text-lg font-medium">/{total}</span>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: pct >= 80 ? "#10b981" : pct >= 40 ? "#3b82f6" : "#f59e0b" }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">{total - filled} slot{total - filled !== 1 ? "s" : ""} remaining</p>
        </div>

        {/* Notes */}
        {shift.shiftNotes && (
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-slate-700 leading-relaxed">{shift.shiftNotes}</p>
          </div>
        )}

        {/* Employee list */}
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Accepted Employees ({filled})
          </p>
          {shift.acceptedEmployees?.length > 0 ? (
            <div className="space-y-2">
              {shift.acceptedEmployees.map((emp, idx) => (
                <div key={emp._id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad(emp.username)} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
                    {initials(emp.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.username}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                  </div>
                  <span className="text-xs text-slate-300 font-medium tabular-nums">#{idx + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <UserCheck className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium text-slate-500">No employees yet</p>
              <p className="text-xs text-slate-400 mt-1">Employees will appear once they accept this shift.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:5000/api/manager/shifts/dashboard/data", { withCredentials: true })
      .then(res => setData(res.data))
      .catch(err => {
        if (err.response?.status === 401) navigate("/login");
        else toast.error("Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) return <LoadingScreen />;

  const { stats, capacity, attendance, notifications, recentShifts } = data || {};
  const nextShift = stats?.nextShift;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ══════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 md:px-8 py-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-24 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-4 right-64 w-16 h-16 rounded-full bg-white/5" />

        <div className="max-w-6xl mx-auto flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Live</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Manager Dashboard</h1>
            <p className="text-blue-200 text-sm mt-1.5">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}! Here's your shift overview.
            </p>

            {/* Quick action links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { label: "Shift Management", path: "/manager/shifts" },
                { label: "Employees", path: "/manager/employees" },
                { label: "Calendar", path: "/manager/calender" },
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
          <KpiCard icon={Users} label="Total Employees" value={stats?.totalEmployees ?? 0} gradient="from-blue-600 to-indigo-600" sub="Registered staff" />
          <KpiCard icon={CalendarDays} label="Upcoming Shifts" value={stats?.upcomingCount ?? 0} gradient="from-violet-500 to-purple-600" sub="Scheduled ahead" />
          <KpiCard icon={BarChart2} label="Capacity" value={`${capacity ?? 0}%`} gradient="from-emerald-500 to-teal-600" sub="Slot fill rate" />
          <KpiCard icon={Activity} label="Attendance Rate" value={`${attendance?.rate ?? 0}%`} gradient="from-orange-500 to-amber-500" sub="This period" />
        </div>

        {/* ══════════════════════════════════════════════════════
            NEXT SHIFT + ALERTS (2-col)
        ══════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Next Shift — prominent card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wider text-xs">Next Scheduled Shift</p>
            </div>
            {nextShift ? (
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-tight">{nextShift.label}</p>
                    <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{fmtDate(nextShift.date)}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtTime(nextShift.date)}</span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Upcoming
                </span>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center py-12 text-slate-400">
                <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
                <p className="font-medium text-slate-500">No upcoming shifts scheduled</p>
                <p className="text-sm text-slate-400 mt-1">Create a shift to get started</p>
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
              {notifications?.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="p-4 space-y-2 max-h-44 overflow-y-auto">
              {notifications?.length > 0 ? (
                notifications.map((n, i) => <AlertItem key={i} message={n} />)
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium text-slate-500">All clear</p>
                  <p className="text-xs text-slate-400 mt-0.5">No alerts right now</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RECENT SHIFTS TABLE
        ══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Shifts</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click on a row to view employees</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1.5 rounded-full">
              {recentShifts?.length ?? 0} total
            </span>
          </div>

          {/* Table */}
          {recentShifts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-44">Fill Rate</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentShifts.map(shift => {
                    const filled = shift.acceptedEmployees?.length || 0;
                    const total = shift.slotsAvailable || 0;
                    const st = STATUS[getStatus(shift.shiftStartTime, shift.shiftEndTime)];
                    return (
                      <tr
                        key={shift._id}
                        onClick={() => setSelected(shift)}
                        className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                              <CalendarDays className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {shift.shiftTitle}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <SlotBar filled={filled} total={total} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />
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
              <p className="font-medium text-slate-500">No shifts recorded yet</p>
              <p className="text-sm mt-1">Create your first shift to see it here.</p>
            </div>
          )}
        </div>

      </div>

      {/* Shift Detail Drawer */}
      <ShiftModal shift={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Dashboard;
