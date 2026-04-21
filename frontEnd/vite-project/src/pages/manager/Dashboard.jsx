import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SkeletonCard, ErrorState, DonutChart, KpiCard } from "@/components/ui";
import {
  X, UserCheck,
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

const SHIFT_STATUS_COLORS = {
  ongoing: "#059669",
  upcoming: "#1B3F8B",
  needsStaff: "#f59e0b",
  completed: "#d1d5db",
};

const GRADS = [
  "from-[#1B3F8B] to-[#162d5e]", "from-[#2563EB] to-[#1B3F8B]",
  "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600", "from-cyan-500 to-[#2563EB]",
];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const initials = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

function classifyShiftForDonut(shift) {
  const s = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const open = shift.slotsAvailable ?? 0;
  if (s === "ongoing") return "ongoing";
  if (s === "completed") return "completed";
  if (s === "upcoming" && open > 0) return "needsStaff";
  if (s === "upcoming") return "upcoming";
  return "completed";
}

function scaleCountsToTotal(raw, total) {
  const keys = ["ongoing", "upcoming", "needsStaff", "completed"];
  const sum = keys.reduce((a, k) => a + raw[k], 0);
  if (total <= 0) return { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  if (sum <= 0) return { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  const scaled = keys.map((k) => Math.round((raw[k] / sum) * total));
  let diff = total - scaled.reduce((a, b) => a + b, 0);
  const maxIdx = scaled.indexOf(Math.max(...scaled));
  scaled[maxIdx] += diff;
  return { ongoing: scaled[0], upcoming: scaled[1], needsStaff: scaled[2], completed: scaled[3] };
}

const BannerClock = React.memo(() => {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-3 text-right backdrop-blur-sm shrink-0">
      <p className="text-white text-xl font-bold tabular-nums tracking-tight">
        {t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-white/70 text-xs mt-1">
        {t.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </p>
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden />
        <span className="text-white/50 text-xs">Live</span>
      </div>
    </div>
  );
});

function DonutLegendRows({ rows, total, valueMode = "count" }) {
  const denom = total > 0 ? total : 1;
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.value / denom) * 100) : 0;
        const barPct = total > 0 ? (row.value / denom) * 100 : 0;
        return (
          <li key={row.name}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate text-sm text-gray-700">{row.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {valueMode === "percent" ? `${pct}%` : row.value}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${barPct}%`, backgroundColor: row.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const ShiftModal = ({ shift, onClose }) => {
  if (!shift) return null;
  const filled = shift.acceptedEmployees?.length || 0;
  const total = shift.slotsAvailable || 0;
  const pct = total > 0 ? Math.min(Math.round((filled / total) * 100), 100) : 0;
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const st = STATUS[status];
  const bar = pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-[#1B3F8B]" : "bg-amber-400";

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4 sm:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white h-full w-full sm:w-[420px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}>

        <div className="bg-gradient-to-br from-[#1B3F8B] via-[#1B3F8B] to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight truncate">{shift.shiftTitle}</h2>
              <p className="text-white/70 text-sm mt-2">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button onClick={onClose}
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

const Dashboard = () => {
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
      <div className="min-h-full space-y-6 bg-[#F8F9FC] p-6">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/90" aria-hidden />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SkeletonCard lines={5} />
          </div>
          <div className="lg:col-span-4">
            <SkeletonCard lines={5} />
          </div>
          <div className="lg:col-span-3">
            <SkeletonCard lines={5} />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-full bg-[#F8F9FC] p-6">
        <ErrorState
          title="Failed to load dashboard"
          message="Could not load dashboard data. Please refresh."
          onRetry={() => fetchDashboard()}
        />
      </div>
    );
  }

  const { stats, attendance, recentShifts, understaffedShifts } = data || {};

  const totalShiftCount = stats?.totalShifts ?? 0;
  const raw = { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  for (const shift of recentShifts || []) {
    const k = classifyShiftForDonut(shift);
    raw[k] += 1;
  }
  const scaled = scaleCountsToTotal(raw, totalShiftCount);

  const shiftDonutData = [
    { name: "Ongoing", value: scaled.ongoing, color: SHIFT_STATUS_COLORS.ongoing },
    { name: "Upcoming", value: scaled.upcoming, color: SHIFT_STATUS_COLORS.upcoming },
    { name: "Needs staff", value: scaled.needsStaff, color: SHIFT_STATUS_COLORS.needsStaff },
    { name: "Completed", value: scaled.completed, color: SHIFT_STATUS_COLORS.completed },
  ];

  const presentToday = attendance?.presentToday ?? 0;
  const absentToday = attendance?.absentToday ?? 0;
  const lateToday = 0;
  const attendanceTotal = presentToday + lateToday + absentToday;
  const attendanceDonutData = [
    { name: "On time", value: presentToday, color: "#1B3F8B" },
    { name: "Late", value: lateToday, color: "#f59e0b" },
    { name: "Absent", value: absentToday, color: "#ef4444" },
  ];

  const attendanceRows = attendanceDonutData.map((d) => ({
    ...d,
    value: d.value,
  }));

  const now = new Date();
  const dayOfWeek = now.toLocaleDateString(undefined, { weekday: "long" });
  const dateLine = now.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  const recentFive = (recentShifts || []).slice(0, 5);

  const listStatus = (key) => {
    if (key === "ongoing") return { dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800", label: "Live" };
    if (key === "upcoming") return { dot: "bg-[#1B3F8B]", pill: "bg-blue-100 text-blue-800", label: "Soon" };
    return { dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600", label: "Done" };
  };

  return (
    <div className="min-h-full bg-[#F8F9FC]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-6 md:pt-8 lg:pb-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-[#1B3F8B] px-6 py-6 shadow-lg shadow-[#1B3F8B]/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-white/80">{greeting()}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {getDisplayName(user, "Manager")}
            </h1>
            <p className="mt-1 text-xs text-white/60">
              {dayOfWeek}, {dateLine}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Manager Panel
            </p>
          </div>
          <BannerClock />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard variant="navy" label="Total Staff" value={stats?.totalEmployees ?? 0} />
          <KpiCard variant="default" label="Upcoming Shifts" value={stats?.upcomingCount ?? 0} />
          <KpiCard variant="green" label="Present Rate" value={`${attendance?.rate ?? 0}%`} />
          <KpiCard variant="amber" label="Need Staff" value={understaffedShifts ?? 0} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-5">
            <h2 className="text-sm font-semibold text-gray-900">Shifts by status</h2>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <DonutChart
                data={shiftDonutData}
                centerValue={String(totalShiftCount)}
                centerLabel="total"
                size={120}
              />
              <div className="w-full min-w-0 flex-1">
                <DonutLegendRows rows={shiftDonutData} total={totalShiftCount} valueMode="count" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-4">
            <h2 className="text-sm font-semibold text-gray-900">Staff presence</h2>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <DonutChart
                data={attendanceDonutData}
                centerValue={`${attendance?.rate ?? 0}%`}
                centerLabel="on time"
                size={120}
              />
              <div className="w-full min-w-0 flex-1">
                <DonutLegendRows rows={attendanceRows} total={attendanceTotal} valueMode="percent" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
              <button
                type="button"
                onClick={() => navigate("/manager/shifts")}
                className="text-sm font-medium text-[#1B3F8B] hover:underline"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-50 p-2">
              {recentFive.length > 0 ? (
                recentFive.map((shift) => {
                  const filled = shift.acceptedEmployees?.length || 0;
                  const total = shift.slotsAvailable || 0;
                  const key = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                  const ls = listStatus(key);
                  return (
                    <button
                      type="button"
                      key={shift._id}
                      onClick={() => setSelected(shift)}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50/80"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ls.dot}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{shift.shiftTitle}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} · {filled}/{total} slots
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ls.pill}`}>
                        {ls.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">No recent shifts</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShiftModal shift={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Dashboard;
