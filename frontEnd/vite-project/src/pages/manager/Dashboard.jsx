import React, { useEffect, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ErrorState,
  DonutChart,
  KpiCard,
  SkeletonKpi,
  SkeletonDonutPlaceholder,
  SkeletonList,
} from "@/components/ui";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  X,
  UserCheck,
} from "lucide-react";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/apiError";
import { getStatus } from "@/utils/shiftStatus";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS = {
  upcoming: { label: "Upcoming", cls: "bg-[#EFF6FF] text-[#1B3F8B]", dot: "bg-[#1B3F8B]" },
  ongoing: { label: "Ongoing", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", cls: "bg-slate-100 text-gray-500", dot: "bg-slate-400" },
};

const SHIFT_STATUS_COLORS = {
  ongoing: "#059669",
  upcoming: "#1B3F8B",
  needsStaff: "#f59e0b",
  completed: "#d1d5db",
};

const GRADS = [
  "from-[#1B3F8B] to-[#162d5e]",
  "from-[#2563EB] to-[#1B3F8B]",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-[#2563EB]",
];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const initials = (n = "") =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

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
  const diff = total - scaled.reduce((a, b) => a + b, 0);
  const maxIdx = scaled.indexOf(Math.max(...scaled));
  scaled[maxIdx] += diff;
  return { ongoing: scaled[0], upcoming: scaled[1], needsStaff: scaled[2], completed: scaled[3] };
}

function DonutLegendRows({ rows, total, valueMode = "count" }) {
  const denom = total > 0 ? total : 1;
  return (
    <ul className="w-full space-y-2">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.value / denom) * 100) : 0;
        const barPct = total > 0 ? (row.value / denom) * 100 : 0;
        return (
          <li key={row.name} className="w-full">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate text-sm text-gray-700">{row.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {valueMode === "percent" ? `${pct}%` : row.value}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
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
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-4 sm:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="h-full w-full animate-in slide-in-from-right overflow-y-auto bg-white shadow-2xl duration-300 sm:w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#1B3F8B] via-[#1B3F8B] to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-3">
              <span
                className={`mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="truncate text-xl font-bold leading-tight text-white">{shift.shiftTitle}</h2>
              <p className="mt-2 text-sm text-white/70">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-white transition hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-100 p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Slot Capacity</p>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold tabular-nums text-gray-900">{filled}</span>
              <span className="text-lg font-medium text-gray-400">/{total}</span>
            </div>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{
                color: pct >= 80 ? "#10b981" : pct >= 40 ? "#1B3F8B" : "#f59e0b",
              }}
            >
              {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {total - filled} slot{total - filled !== 1 ? "s" : ""} remaining
          </p>
        </div>

        {shift.shiftNotes && (
          <div className="border-b border-gray-100 px-6 py-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Notes</p>
            <p className="text-sm leading-relaxed text-gray-700">{shift.shiftNotes}</p>
          </div>
        )}

        <div className="px-6 py-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Accepted Employees ({filled})
          </p>
          {shift.acceptedEmployees?.length > 0 ? (
            <div className="space-y-2">
              {shift.acceptedEmployees.map((emp, idx) => (
                <div
                  key={emp._id}
                  className="hover:bg-gray-50 group flex items-center gap-3 rounded-xl p-3 transition-colors"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad(emp.username)} text-sm font-bold text-white shadow-sm`}
                  >
                    {initials(emp.username)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{emp.username}</p>
                    <p className="truncate text-xs text-gray-400">{emp.email}</p>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-gray-300">#{idx + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <UserCheck className="mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm font-medium text-gray-500">No employees yet</p>
              <p className="mt-1 text-xs text-gray-400">Employees will appear once they accept this shift.</p>
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

  const fetchDashboardSilent = useCallback(async () => {
    try {
      const res = await API.get("/api/manager/shifts/dashboard/data");
      setData(res.data?.data ?? res.data);
    } catch {
      /* silent — keep previous data */
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useAutoRefresh(fetchDashboardSilent, 60_000);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) {
    return (
      <div className="min-h-full space-y-6 bg-[#F8F9FC] p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:items-stretch">
          {[...Array(4)].map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="h-4 w-36 max-w-full animate-pulse rounded bg-gray-200" />
            <SkeletonDonutPlaceholder />
          </div>
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="h-4 w-36 max-w-full animate-pulse rounded bg-gray-200" />
            <SkeletonDonutPlaceholder />
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="p-3">
              <SkeletonList count={4} />
            </div>
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
          description="Could not load dashboard data. Please try again."
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
  const lateToday = attendance?.lateToday ?? 0;
  const absentToday = attendance?.absentToday ?? 0;
  const onTime = Math.max(0, presentToday - lateToday);
  const attendanceTotal = onTime + lateToday + absentToday;
  const onTimeRate = attendanceTotal > 0 ? Math.round((onTime / attendanceTotal) * 100) : 0;

  const attendanceDonutData = [
    { name: "On time", value: onTime, color: "#1B3F8B" },
    { name: "Late", value: lateToday, color: "#f59e0b" },
    { name: "Absent", value: absentToday, color: "#ef4444" },
  ];

  const attendanceRows = attendanceDonutData.map((d) => ({ ...d }));

  const recentFive = (recentShifts || []).slice(0, 5);

  const listStatus = (key) => {
    if (key === "ongoing") return { pill: "bg-emerald-100 text-emerald-800", label: "Live" };
    if (key === "upcoming") return { pill: "bg-blue-100 text-blue-800", label: "Soon" };
    return { pill: "bg-gray-100 text-gray-600", label: "Done" };
  };

  return (
    <div className="min-h-full bg-[#F8F9FC]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:px-6 md:pt-4 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, here is your overview</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap"></div>
        </div>
        <div className="mb-4 grid h-auto grid-cols-2 gap-3 lg:grid-cols-4 lg:items-stretch">
          <KpiCard variant="navy" icon={Users} label="Total Staff" value={stats?.totalEmployees ?? 0} />
          <KpiCard variant="default" icon={Calendar} label="Upcoming Shifts" value={stats?.upcomingCount ?? 0} />
          <KpiCard variant="green" icon={TrendingUp} label="Present Rate" value={`${attendance?.rate ?? 0}%`} />
          <KpiCard variant="amber" icon={AlertTriangle} label="Need Staff" value={understaffedShifts ?? 0} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-gray-900">Shifts by status</h2>
            <div className="mt-3 flex flex-col items-center">
              <DonutChart data={shiftDonutData} centerValue={String(totalShiftCount)} centerLabel="total" size={120} />
              <div className="mt-2 w-full">
                <DonutLegendRows rows={shiftDonutData} total={totalShiftCount} valueMode="count" />
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-gray-900">Staff presence</h2>
            <div className="mt-3 flex flex-col items-center">
              <DonutChart
                data={attendanceDonutData}
                centerValue={`${onTimeRate}%`}
                centerLabel="on time"
                size={120}
              />
              <div className="mt-2 w-full">
                <DonutLegendRows rows={attendanceRows} total={attendanceTotal} valueMode="percent" />
              </div>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
              <button
                type="button"
                onClick={() => navigate("/manager/shifts")}
                className="text-sm font-medium text-[#1B3F8B] hover:underline transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1 rounded"
              >
                View all
              </button>
            </div>
            <div className="flex flex-1 flex-col divide-y divide-gray-50 p-3">
              {recentFive.length > 0 ? (
                recentFive.map((shift) => {
                  const filled = shift.acceptedEmployees?.length || 0;
                  const openSlots = shift.slotsAvailable ?? 0;
                  const totalSlots = filled + openSlots;
                  const fillPct = totalSlots > 0 ? Math.round((filled / totalSlots) * 100) : 0;
                  const key = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                  const ls = listStatus(key);
                  return (
                    <button
                      type="button"
                      key={shift._id}
                      onClick={() => setSelected(shift)}
                      className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-100 first:pt-2 last:pb-2 hover:bg-gray-50/80 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{shift.shiftTitle}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)}
                        </p>
                        <p className="mt-1.5 text-xs text-gray-500">
                          {filled} of {totalSlots} filled
                        </p>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-[#1B3F8B] transition-all"
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ls.pill}`}>
                        {ls.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-12">
                  <p className="text-sm text-gray-400">No recent shifts</p>
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

export default Dashboard;
