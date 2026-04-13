import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SkeletonCard, ErrorState } from "@/components/ui";
import {
  Users, CalendarDays,
  X, CheckCircle2,
  TrendingUp, UserCheck,
  Zap,
} from "lucide-react";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/apiError";
import { getStatus } from "@/utils/shiftStatus";
import { getDisplayName } from "@/utils/displayName";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS = {
  upcoming: { label: "Upcoming", cls: "bg-[#EFF6FF] text-[#1B3F8B]", dot: "bg-[#1B3F8B]" },
  ongoing: { label: "Ongoing", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

const GRADS = [
  "from-[#1B3F8B] to-[#162d5e]", "from-[#2563EB] to-[#1B3F8B]",
  "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600", "from-cyan-500 to-[#2563EB]",
];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const initials = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const BannerTimeCard = React.memo(() => {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="bg-white/10 border border-white/15 rounded-xl px-5 py-3 text-right backdrop-blur-sm shrink-0">
      <p className="text-white text-xl font-bold tabular-nums tracking-tight">
        {t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-white/40 text-xs mt-0.5">
        {t.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
      </p>
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#93C5FD] animate-pulse" aria-hidden />
        <span className="text-white/30 text-[10px]">Live</span>
      </div>
    </div>
  );
});

const KpiCard = ({ icon: Icon, label, value, trend }) => (
  <div className="bg-white rounded-xl border border-slate-200 border-t-2 border-t-[#1B3F8B] shadow-sm p-5 flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[#1B3F8B]" />
      </div>
      {trend != null && (
        <span className="bg-[#EFF6FF] text-[#1B3F8B] text-[10px] font-bold px-2 py-0.5 rounded-md">{trend}</span>
      )}
    </div>
    <p className="text-3xl font-extrabold text-[#0f2042] tabular-nums leading-none">{value}</p>
    <p className="text-slate-400 text-xs font-medium mt-1">{label}</p>
  </div>
);

const AlertItem = ({ message }) => {
  const low = message.toLowerCase();
  const warn = low.includes("low") || low.includes("miss") || low.includes("short");
  const good = low.includes("full") || low.includes("complete");
  const cls = warn
    ? "bg-amber-50 border-amber-400 text-amber-800"
    : good
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-[#EFF6FF] border-[#93C5FD] text-[#1B3F8B]";
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg mb-2 border-l-2 last:mb-0 text-sm ${cls}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${warn ? "bg-amber-400" : good ? "bg-emerald-500" : "bg-[#93C5FD]"}`} aria-hidden />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
};

const ShiftModal = ({ shift, onClose }) => {
  if (!shift) return null;
  const filled = shift.acceptedEmployees?.length || 0;
  const total = shift.slotsAvailable || 0;
  const pct = total > 0 ? Math.min(Math.round((filled / total) * 100), 100) : 0;
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const st = STATUS[status];
  const bar = pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-[#1B3F8B]" : "bg-amber-400";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4 sm:p-0"
      onClick={onClose}>
      <div className="bg-white h-full w-full sm:w-[420px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-[#1B3F8B] via-[#1B3F8B] to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight truncate">{shift.shiftTitle}</h2>
              <p className="text-white/70 text-sm mt-2">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button type="button" onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition text-white shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Slot Capacity</p>
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-slate-900 tabular-nums">{filled}</span>
              <span className="text-slate-400 text-lg font-medium">/{total}</span>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: pct >= 80 ? "#10b981" : pct >= 40 ? "#1B3F8B" : "#f59e0b" }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">{total - filled} slot{total - filled !== 1 ? "s" : ""} remaining</p>
        </div>

        {shift.shiftNotes && (
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-slate-700 leading-relaxed">{shift.shiftNotes}</p>
          </div>
        )}

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

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await API.get("/api/manager/shifts/dashboard/data");
      setData(res.data?.data ?? res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setFetchError(true);
        toast.error(getApiErrorMessage(err, "Failed to load dashboard"));
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-[#f1f5f9] min-h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 bg-[#f1f5f9] min-h-full">
        <ErrorState
          title="Failed to load dashboard"
          message="Could not load dashboard data. Please refresh."
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const { stats, capacity, attendance, notifications, recentShifts } = data || {};
  const todayStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-full bg-[#f1f5f9]">
      <div className="bg-[#1B3F8B] px-6 pt-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-normal">{greeting()},</p>
            <p className="text-white text-3xl font-extrabold tracking-tight leading-tight">
              {getDisplayName(user, "Admin")} 👋
            </p>
            <p className="text-white/40 text-xs mt-2">{todayStr} · Admin Panel</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="bg-white text-[#1B3F8B] font-bold text-xs px-5 py-2 rounded-lg hover:bg-slate-50 transition"
              >
                User Management
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/managers")}
                className="bg-white/10 border border-white/15 text-white/80 text-xs px-4 py-2 rounded-lg hover:bg-white/15 transition"
              >
                Managers
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/employees")}
                className="bg-white/10 border border-white/15 text-white/80 text-xs px-4 py-2 rounded-lg hover:bg-white/15 transition"
              >
                Employees
              </button>
            </div>
          </div>
          <BannerTimeCard />
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 px-6 pb-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Total Employees" value={stats?.totalEmployees ?? 0} trend="Staff" />
          <KpiCard icon={CalendarDays} label="Upcoming Shifts" value={stats?.upcomingCount ?? 0} trend="Live" />
          <KpiCard icon={Zap} label="Capacity" value={`${capacity ?? 0}%`} trend="Fill" />
          <KpiCard icon={TrendingUp} label="Attendance Rate" value={`${attendance?.rate ?? 0}%`} trend="Period" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-[#0f2042] text-sm">Recent Shifts</h2>
              <button
                type="button"
                onClick={() => navigate("/admin/calendar")}
                className="text-[#1B3F8B] text-xs font-semibold hover:underline"
              >
                View all
              </button>
            </div>
            {recentShifts?.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentShifts.map(shift => {
                  const filled = shift.acceptedEmployees?.length || 0;
                  const total = shift.slotsAvailable || 0;
                  const st = STATUS[getStatus(shift.shiftStartTime, shift.shiftEndTime)];
                  return (
                    <button
                      type="button"
                      key={shift._id}
                      onClick={() => setSelected(shift)}
                      className="w-full flex items-center justify-between py-3 text-left border-b border-slate-50 last:border-0 hover:bg-[#f8fafc] transition-colors rounded-lg px-1 -mx-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                          <CalendarDays className="h-4 w-4 text-[#1B3F8B]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0f2042] text-sm truncate">{shift.shiftTitle}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.cls}`}>
                          <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        <div className="w-16 mt-1">
                          <div className="bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-[#1B3F8B] h-1 rounded-full transition-all"
                              style={{ width: `${total > 0 ? Math.min((filled / total) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums">{filled}/{total}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium text-slate-500">No shifts recorded yet</p>
                <button
                  type="button"
                  onClick={() => navigate("/admin/calendar")}
                  className="mt-3 text-xs font-semibold text-[#1B3F8B]"
                >
                  Open calendar
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-[#0f2042] text-sm">Alerts</h2>
              {notifications?.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
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
      </div>

      <ShiftModal shift={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default AdminDashboard;
