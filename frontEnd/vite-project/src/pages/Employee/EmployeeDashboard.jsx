import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SkeletonCard, ErrorState } from "@/components/ui";
import {
  CalendarDays, CheckCircle2,
  X, ChevronRight,
  ArrowRightLeft, Zap, Bell,
  LogOut as LeaveIcon, ClipboardList,
} from "lucide-react";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";
import { getStatus } from "@/utils/shiftStatus";
import { getDisplayName } from "@/utils/displayName";

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS = {
  upcoming: { label: "Upcoming", cls: "bg-[#EFF6FF] text-[#1B3F8B]", dot: "bg-[#1B3F8B]" },
  ongoing: { label: "Ongoing", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

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

/* ════════════════════════════════════════════════════════════
   KPI STAT CARD
════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════
   ALERT ITEM
════════════════════════════════════════════════════════════ */
const AlertItem = ({ message }) => {
  const low = message.toLowerCase();
  const warn = low.includes("pending") || low.includes("leave") || low.includes("change");
  const good = low.includes("approved") || low.includes("complete");
  const cls = warn ? "bg-amber-50 border-amber-400 text-amber-800"
    : good ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-[#EFF6FF] border-[#93C5FD] text-[#1B3F8B]";
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg mb-2 border-l-2 last:mb-0 text-sm ${cls}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${warn ? "bg-amber-400" : good ? "bg-emerald-500" : "bg-[#93C5FD]"}`} aria-hidden />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
};

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
        <div className="bg-gradient-to-br from-[#1B3F8B] via-[#1B3F8B] to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight">{shift.shiftTitle}</h2>
              <p className="text-white/70 text-sm mt-2">
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
      const params = new URLSearchParams({ page: "1", limit: "50" });
      const [shiftRes, reqRes] = await Promise.all([
        API.get(`/api/employee/shifts/myshifts?${params}`),
        API.get(`/api/employee/shifts/requests?${params}`),
      ]);
      setShifts(Array.isArray(shiftRes.data?.data) ? shiftRes.data.data : []);
      setRequests(Array.isArray(reqRes.data?.data) ? reqRes.data.data : []);
    } catch {
      setFetchError(true);
      toast.error("Failed to load dashboard");
      setShifts([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          message="Could not load your dashboard. Please refresh."
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

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

  const todayStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-full bg-[#f1f5f9]">
      <div className="bg-[#1B3F8B] px-6 pt-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-normal">{greeting()},</p>
            <p className="text-white text-3xl font-extrabold tracking-tight leading-tight">
              {getDisplayName(user, "Employee")} 👋
            </p>
            <p className="text-white/40 text-xs mt-2">{todayStr} · Employee Panel</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                type="button"
                onClick={() => navigate("/employee/AllShifts")}
                className="bg-white text-[#1B3F8B] font-bold text-xs px-5 py-2 rounded-lg hover:bg-slate-50 transition"
              >
                Available Shifts
              </button>
              <button
                type="button"
                onClick={() => navigate("/employee/myshifts")}
                className="bg-white/10 border border-white/15 text-white/80 text-xs px-4 py-2 rounded-lg hover:bg-white/15 transition"
              >
                My Shifts
              </button>
              <button
                type="button"
                onClick={() => navigate("/employee/requests")}
                className="bg-white/10 border border-white/15 text-white/80 text-xs px-4 py-2 rounded-lg hover:bg-white/15 transition"
              >
                My Requests
              </button>
            </div>
          </div>
          <BannerTimeCard />
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 px-6 pb-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={CalendarDays} label="My Total Shifts" value={totalShifts} trend="All" />
          <KpiCard icon={Zap} label="Upcoming" value={upcomingShifts} trend="Live" />
          <KpiCard icon={CheckCircle2} label="Completed" value={completedShifts} trend="Done" />
          <KpiCard icon={ClipboardList} label="Pending Requests" value={pendingRequests} trend="Queue" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-[#0f2042] text-sm">Recent Shifts</h2>
              <button
                type="button"
                onClick={() => navigate("/employee/myshifts")}
                className="text-[#1B3F8B] text-xs font-semibold hover:underline"
              >
                View all
              </button>
            </div>
            {recentShifts.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentShifts.map(shift => {
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
                            {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.cls}`}>
                          <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium text-slate-500">No shifts yet</p>
                <button
                  type="button"
                  onClick={() => navigate("/employee/AllShifts")}
                  className="mt-3 text-xs font-semibold text-[#1B3F8B]"
                >
                  Browse available shifts
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                <h2 className="font-bold text-[#0f2042] text-sm">Alerts</h2>
              </div>
              {pendingRequests > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingRequests}
                </span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-0">
              {alerts.map((n, i) => <AlertItem key={i} message={n} />)}
            </div>
          </div>
        </div>
      </div>

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
